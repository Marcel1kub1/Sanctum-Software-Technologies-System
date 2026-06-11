const express = require('express');
const session = require('express-session');
const passport = require('passport');
const DiscordStrategy = require('passport-discord').Strategy;
const path = require('path');
const config = require('../config');
const { getConfig, updateConfig } = require('../src/database/guildConfig');
const { ChannelType, ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } = require('discord.js');
const db = require('../src/database/connection');
const { sendPanel } = require('../src/handlers/rolePanelHandler');
const { getAllModules, getModuleSchema } = require('../src/utils/moduleSchema');
const { getAllCommands, getCommandSchema } = require('../src/utils/commandSchema');

module.exports = (client) => {
  const app = express();

  app.set('view engine', 'ejs');
  app.set('views', path.join(__dirname, 'views'));
  app.use(express.static(path.join(__dirname, 'public')));
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  app.use(session({
    secret: config.dashboard.sessionSecret,
    resave: false,
    saveUninitialized: false
  }));

  app.use(passport.initialize());
  app.use(passport.session());

  passport.serializeUser((user, done) => done(null, user));
  passport.deserializeUser((obj, done) => done(null, obj));

  const callbackURL = `${config.dashboard.url}/auth/callback`;

  passport.use(new DiscordStrategy({
    clientID: config.bot.clientId,
    clientSecret: config.bot.clientSecret,
    callbackURL,
    scope: ['identify', 'guilds']
  }, (accessToken, refreshToken, profile, done) => done(null, profile)));

  const checkAuth = (req, res, next) => req.isAuthenticated() ? next() : res.redirect('/');

  function getGuildData(g) {
    if (!g) return null;
    const channels = g.channels.cache
      .filter(c => c.type === ChannelType.GuildText || c.type === ChannelType.GuildVoice || c.type === ChannelType.GuildCategory || c.type === ChannelType.GuildAnnouncement)
      .map(c => ({ id: c.id, name: c.name, type: c.type === ChannelType.GuildText ? 'text' : c.type === ChannelType.GuildVoice ? 'voice' : c.type === ChannelType.GuildCategory ? 'category' : 'announcement', position: c.position }))
      .sort((a, b) => a.position - b.position);
    const roles = g.roles.cache
      .filter(r => r.name !== '@everyone')
      .map(r => ({ id: r.id, name: r.name, color: r.hexColor, position: r.position }))
      .sort((a, b) => b.position - a.position);
    const textChannels = channels.filter(c => c.type === 'text' || c.type === 'announcement');
    const voiceChannels = channels.filter(c => c.type === 'voice');
    const categories = channels.filter(c => c.type === 'category');
    return {
      id: g.id, name: g.name, icon: g.iconURL(), memberCount: g.memberCount,
      channels, textChannels, voiceChannels, categories, roles,
      ownerId: g.ownerId,
      createdAt: g.createdAt,
      premiumTier: g.premiumTier,
      premiumSubscriberCount: g.premiumSubscriptionCount,
      verificationLevel: g.verificationLevel,
      explicitContentFilter: g.explicitContentFilter,
      mfaLevel: g.mfaLevel,
      defaultMessageNotifications: g.defaultMessageNotifications
    };
  }

  app.get('/', async (req, res) => {
    const stats = {
      guilds: client ? client.guilds.cache.size : 0,
      users: client ? client.users.cache.size : 0,
      commands: client ? client.commands.size : 0,
      uptime: Math.floor(process.uptime()),
      ping: client ? client.ws.ping : 0
    };
    res.render('index', { config: config.dashboard, stats, user: req.user || null });
  });

  app.get('/auth', passport.authenticate('discord'));
  app.get('/auth/callback', passport.authenticate('discord', { failureRedirect: '/' }), (req, res) => res.redirect('/dashboard'));

  app.get('/dashboard', checkAuth, async (req, res) => {
    const tab = req.query.tab || 'overview';
    const guildId = req.query.guild;
    const moduleName = req.query.module;
    const commandName = req.query.command;
    const guilds = client ? client.guilds.cache.map(g => ({
      id: g.id,
      name: g.name,
      icon: g.iconURL(),
      memberCount: g.memberCount
    })) : [];

    let selectedGuild = null;
    if (guildId) {
      const g = client ? client.guilds.cache.get(guildId) : null;
      if (g) selectedGuild = getGuildData(g);
    }
    if (!selectedGuild && guilds.length > 0) {
      const g = client ? client.guilds.cache.get(guilds[0].id) : null;
      if (g) selectedGuild = getGuildData(g);
    }

    let guildConfig = {};
    let rolePanels = [];
    let moduleSchema = null;
    let commandSchema = null;
    
    if (selectedGuild) {
      try {
        guildConfig = await getConfig(selectedGuild.id);
        rolePanels = await db.query(
          'SELECT p.*, (SELECT COUNT(*) FROM role_panel_roles WHERE panel_id = p.id) as roles_count FROM role_panels p WHERE p.guild_id = ?',
          [selectedGuild.id]
        );
        const guild = client ? client.guilds.cache.get(selectedGuild.id) : null;
        for (const panel of rolePanels) {
          if (panel.channel_id) {
            const ch = guild ? guild.channels.cache.get(panel.channel_id) : null;
            panel.channel_name = ch ? ch.name : null;
          }
          panel.roles = await db.query('SELECT * FROM role_panel_roles WHERE panel_id = ? ORDER BY position ASC', [panel.id]);
          for (const r of panel.roles) {
            const role = guild ? guild.roles.cache.get(r.role_id) : null;
            r.role_name = role ? role.name : 'Unknown';
          }
        }
      } catch (e) {
        guildConfig = {};
      }
    }

    if (tab === 'module' && moduleName) {
      moduleSchema = getModuleSchema(moduleName);
    }

    if (tab === 'command' && commandName) {
      commandSchema = getCommandSchema(commandName);
    }

    const stats = {
      guilds: client ? client.guilds.cache.size : 0,
      users: client ? client.users.cache.size : 0,
      commands: client ? client.commands.size : 0,
      uptime: Math.floor(process.uptime()),
      ping: client ? client.ws.ping : 0
    };

    const botConfig = {
      music: config.music,
      bot: {
        activity: config.bot.activity,
        prefix: config.bot.prefix
      }
    };

    res.render('dashboard', {
      config: config.dashboard,
      botConfig,
      stats,
      user: req.user,
      guilds,
      selectedGuild,
      tab,
      guildConfig,
      moduleSchema,
      moduleName,
      commandSchema,
      commandName
    });
  });

  app.post('/dashboard/config', checkAuth, async (req, res) => {
    const { guild } = req.query;
    if (!guild) return res.status(400).send('Missing guild parameter');

    const sanitized = {};
    for (const [key, val] of Object.entries(req.body)) {
      if (val === 'on' || val === 'true') sanitized[key] = true;
      else if (val === 'off' || val === 'false') sanitized[key] = false;
      else sanitized[key] = val;
    }

    try {
      await updateConfig(guild, sanitized);
      if (client && client._guildConfigCache) client._guildConfigCache.delete(`guild_${guild}`);
      res.redirect(req.get('Referer') || `/dashboard?guild=${guild}`);
    } catch (e) {
      console.error('[Dashboard] Config save error:', e);
      res.status(500).send('Failed to save configuration');
    }
  });

  app.post('/dashboard/role-panels/create', checkAuth, async (req, res) => {
    const guild = req.query.guild;
    if (!guild) return res.status(400).send('Missing guild');
    const { title, description, channel_id } = req.body;
    if (!title || !channel_id) return res.status(400).send('Missing fields');
    try {
      const result = await db.query('INSERT INTO role_panels (guild_id, title, description, channel_id) VALUES (?, ?, ?, ?)',
        [guild, title, description || '', channel_id]);
      const panel = (await db.query('SELECT * FROM role_panels WHERE id = ?', [result.insertId]))[0];
      if (panel && client) await sendPanel(client, guild, panel);
      res.redirect(`/dashboard?tab=role-panels&guild=${guild}`);
    } catch (e) {
      console.error('[Dashboard] Role panel create error:', e);
      res.status(500).send('Failed to create panel');
    }
  });

  app.post('/dashboard/role-panels/send', checkAuth, async (req, res) => {
    const guild = req.query.guild;
    const { panel_id } = req.body;
    if (!guild || !panel_id) return res.status(400).send('Missing fields');
    try {
      const panel = (await db.query('SELECT * FROM role_panels WHERE id = ? AND guild_id = ?', [panel_id, guild]))[0];
      if (panel && client) await sendPanel(client, guild, panel);
      res.redirect(`/dashboard?tab=role-panels&guild=${guild}`);
    } catch (e) {
      console.error('[Dashboard] Role panel send error:', e);
      res.status(500).send('Failed to send panel');
    }
  });

  app.post('/dashboard/role-panels/add-role', checkAuth, async (req, res) => {
    const guild = req.query.guild;
    const { panel_id, role_id, label, emoji } = req.body;
    if (!guild || !panel_id || !role_id) return res.status(400).send('Missing fields');
    try {
      const count = (await db.query('SELECT COUNT(*) as c FROM role_panel_roles WHERE panel_id = ?', [panel_id]))[0].c;
      await db.query('INSERT INTO role_panel_roles (panel_id, guild_id, role_id, label, emoji, position) VALUES (?, ?, ?, ?, ?, ?)',
        [panel_id, guild, role_id, label || '', emoji || '', count]);
      const panel = (await db.query('SELECT * FROM role_panels WHERE id = ?', [panel_id]))[0];
      if (panel && client) await sendPanel(client, guild, panel);
      res.redirect(`/dashboard?tab=role-panels&guild=${guild}`);
    } catch (e) {
      console.error('[Dashboard] Role panel add-role error:', e);
      res.status(500).send('Failed to add role');
    }
  });

  app.post('/dashboard/role-panels/remove-role', checkAuth, async (req, res) => {
    const guild = req.query.guild;
    const { entry_id } = req.body;
    if (!guild || !entry_id) return res.status(400).send('Missing fields');
    try {
      const entry = (await db.query('SELECT panel_id FROM role_panel_roles WHERE id = ?', [entry_id]))[0];
      await db.query('DELETE FROM role_panel_roles WHERE id = ?', [entry_id]);
      if (entry && client) {
        const panel = (await db.query('SELECT * FROM role_panels WHERE id = ?', [entry.panel_id]))[0];
        if (panel) await sendPanel(client, guild, panel);
      }
      res.redirect(`/dashboard?tab=role-panels&guild=${guild}`);
    } catch (e) {
      res.status(500).send('Failed to remove role');
    }
  });

  app.post('/dashboard/role-panels/delete', checkAuth, async (req, res) => {
    const guild = req.query.guild;
    const { panel_id } = req.body;
    if (!guild || !panel_id) return res.status(400).send('Missing fields');
    try {
      await db.query('DELETE FROM role_panel_roles WHERE panel_id = ?', [panel_id]);
      await db.query('DELETE FROM role_panels WHERE id = ? AND guild_id = ?', [panel_id, guild]);
      res.redirect(`/dashboard?tab=role-panels&guild=${guild}`);
    } catch (e) {
      res.status(500).send('Failed to delete panel');
    }
  });

  app.post('/dashboard/tickets/send', checkAuth, async (req, res) => {
    const guild = req.query.guild;
    if (!guild) return res.status(400).send('Missing guild');
    try {
      const guildCfg = await getConfig(guild);
      const channelId = guildCfg.tickets_panel_channel;
      if (!channelId) return res.status(400).send('No panel channel configured');
      const g = client ? client.guilds.cache.get(guild) : null;
      if (!g) return res.status(404).send('Guild not found');
      const ch = g.channels.cache.get(channelId);
      if (!ch) return res.status(404).send('Channel not found');

      const title = guildCfg.tickets_panel_title || 'Create a Ticket';
      const desc = guildCfg.tickets_panel_description || 'Click the button below to open a ticket and our team will assist you.';
      const imageUrl = guildCfg.tickets_panel_image_url || '';
      const b1 = guildCfg.tickets_button_1_label || 'General Support';
      const b2 = guildCfg.tickets_button_2_label || 'Technical Support';
      const b3 = guildCfg.tickets_button_3_label || 'Report Issue';
      const b4 = guildCfg.tickets_button_4_label || 'Other';

      const embed = new EmbedBuilder().setTitle(title).setDescription(desc).setColor(0x11111);
      if (imageUrl) embed.setImage(imageUrl);
      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId('ticket_panel_general').setLabel(b1).setStyle(ButtonStyle.Primary),
        new ButtonBuilder().setCustomId('ticket_panel_technical').setLabel(b2).setStyle(ButtonStyle.Secondary),
        new ButtonBuilder().setCustomId('ticket_panel_report').setLabel(b3).setStyle(ButtonStyle.Danger),
        new ButtonBuilder().setCustomId('ticket_panel_other').setLabel(b4).setStyle(ButtonStyle.Secondary)
      );

      await ch.send({ embeds: [embed], components: [row] });
      res.redirect(`/dashboard?tab=tickets&guild=${guild}`);
    } catch (e) {
      console.error('[Dashboard] Send tickets panel error:', e);
      res.status(500).send('Failed to send panel');
    }
  });

  app.get('/logout', (req, res) => {
    req.logout(() => res.redirect('/'));
  });

  // Music Status API - Live Lavalink and player data
  app.get('/api/music/status', (req, res) => {
    const guildId = req.query.guild;
    const musicCfg = config.music;
    let node = null;
    let shoukakuPlayer = null;
    let queue = null;
    let status = null;
    try {
      if (client && client.lavalink) {
        node = client.lavalink.getNode ? client.lavalink.getNode() : null;
        if (guildId) {
          shoukakuPlayer = client.lavalink.shoukaku?.players?.get(guildId) || null;
          queue = client.lavalink.getQueue ? client.lavalink.getQueue(guildId) : null;
          status = client.lavalink.getStatus ? client.lavalink.getStatus(guildId) : null;
        }
      }
    } catch (e) { /* ignore */ }

    const nodeStats = node ? {
      connected: true,
      players: (node.stats && typeof node.stats.players === 'number') ? node.stats.players : 0,
      playingPlayers: (node.stats && typeof node.stats.playingPlayers === 'number') ? node.stats.playingPlayers : 0,
      uptime: node.stats?.uptime || 0,
      cpu: node.stats?.cpu?.systemLoad || 0,
      memory: {
        used: node.stats?.memory?.used || 0,
        reserved: node.stats?.memory?.reserved || 0,
        free: node.stats?.memory?.free || 0
      }
    } : { connected: false };

    const currentTrack = status && status.current ? status.current : null;

    res.json({
      configured: {
        host: musicCfg.lavalink?.host || 'localhost',
        port: musicCfg.lavalink?.port || 2333,
        ssl: musicCfg.lavalink?.ssl || false,
        engine: musicCfg.engine || 'lavalink'
      },
      node: nodeStats,
      player: {
        connected: !!shoukakuPlayer,
        playing: shoukakuPlayer ? !!shoukakuPlayer.track : false,
        paused: shoukakuPlayer ? !!shoukakuPlayer.paused : false,
        position: shoukakuPlayer ? (shoukakuPlayer.position || 0) : 0,
        ping: shoukakuPlayer ? (shoukakuPlayer.ping || 0) : 0,
        volume: status ? (status.volume || 50) : 50,
        current: currentTrack ? {
          title: currentTrack.info?.title || 'Unknown',
          author: currentTrack.info?.author || 'Unknown',
          duration: currentTrack.info?.length || 0,
          uri: currentTrack.info?.uri || '',
          identifier: currentTrack.info?.identifier || ''
        } : null,
        queueSize: queue ? (queue.tracks?.length || 0) : 0,
        historySize: queue ? (queue.history?.length || 0) : 0,
        loop: status ? (status.loop || 'off') : 'off',
        shuffled: status ? !!status.shuffled : false,
        autoplay: status ? !!status.autoplay : false
      }
    });
  });

  // Guild Activity API - 7-day chart data
  app.get('/api/activity/:guildId', async (req, res) => {
    const guildId = req.params.guildId;
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const modActions = [0, 0, 0, 0, 0, 0, 0];
    const tickets = [0, 0, 0, 0, 0, 0, 0];

    try {
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      const logs = await db.query(
        'SELECT action, created_at FROM audit_logs WHERE guild_id = ? AND created_at >= ?',
        [guildId, sevenDaysAgo]
      );
      for (const log of logs) {
        const d = new Date(log.created_at);
        const dayIndex = d.getDay();
        modActions[dayIndex]++;
      }

      const ticketRows = await db.query(
        'SELECT created_at FROM tickets WHERE guild_id = ? AND created_at >= ?',
        [guildId, sevenDaysAgo]
      );
      for (const t of ticketRows) {
        const d = new Date(t.created_at);
        const dayIndex = d.getDay();
        tickets[dayIndex]++;
      }
    } catch (e) { /* no audit_logs table or no data */ }

    const labels = days;
    const maxVal = Math.max(1, ...modActions, ...tickets);
    res.json({
      labels,
      modActions,
      tickets,
      maxVal
    });
  });

  // Guild-specific stats
  app.get('/api/guild/stats/:guildId', async (req, res) => {
    const guildId = req.params.guildId;
    let openTickets = 0;
    let modActionsThisWeek = 0;
    let leveledUsers = 0;
    let levelUpsThisWeek = 0;

    try {
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      const ticketCount = await db.query(
        'SELECT COUNT(*) as c FROM tickets WHERE guild_id = ? AND status = ?',
        [guildId, 'open']
      );
      openTickets = ticketCount[0]?.c || 0;

      const modCount = await db.query(
        'SELECT COUNT(*) as c FROM audit_logs WHERE guild_id = ? AND created_at >= ?',
        [guildId, sevenDaysAgo]
      );
      modActionsThisWeek = modCount[0]?.c || 0;
    } catch (e) { /* ignore */ }

    res.json({
      memberCount: client ? (client.guilds.cache.get(guildId)?.memberCount || 0) : 0,
      openTickets,
      modActionsThisWeek,
      leveledUsers,
      levelUpsThisWeek
    });
  });

  // Module Configuration API
  app.get('/api/modules', (req, res) => {
    res.json(getAllModules());
  });

  app.get('/api/modules/:moduleName/schema', (req, res) => {
    const schema = getModuleSchema(req.params.moduleName);
    if (!schema) return res.status(404).json({ error: 'Module not found' });
    res.json(schema);
  });

  app.get('/api/modules/:moduleName/config', async (req, res) => {
    const guildId = req.query.guild;
    if (!guildId) return res.status(400).json({ error: 'Missing guild parameter' });
    
    try {
      const guildConfig = await getConfig(guildId);
      const schema = getModuleSchema(req.params.moduleName);
      if (!schema) return res.status(404).json({ error: 'Module not found' });
      
      const moduleConfig = {};
      schema.fields.forEach(field => {
        moduleConfig[field.key] = guildConfig[field.key] !== undefined ? guildConfig[field.key] : field.default;
      });
      res.json({ config: moduleConfig, schema });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });

  app.post('/api/modules/:moduleName/config', checkAuth, async (req, res) => {
    const guildId = req.query.guild;
    if (!guildId) return res.status(400).json({ error: 'Missing guild parameter' });

    try {
      const schema = getModuleSchema(req.params.moduleName);
      if (!schema) return res.status(404).json({ error: 'Module not found' });

      // Validate and sanitize incoming config
      const updates = {};
      schema.fields.forEach(field => {
        if (req.body[field.key] !== undefined) {
          let value = req.body[field.key];
          
          if (field.type === 'toggle') {
            value = value === 'on' || value === 'true' || value === true;
          } else if (field.type === 'number') {
            value = parseInt(value, 10);
            if (field.min !== undefined) value = Math.max(value, field.min);
            if (field.max !== undefined) value = Math.min(value, field.max);
          }
          
          updates[field.key] = value;
        }
      });

      await updateConfig(guildId, updates);
      if (client && client._guildConfigCache) client._guildConfigCache.delete(`guild_${guildId}`);
      
      res.json({ success: true, config: updates });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });

  // Command Configuration API
  app.get('/api/commands', (req, res) => {
    res.json(getAllCommands());
  });

  app.get('/api/commands/:commandName/schema', (req, res) => {
    const schema = getCommandSchema(req.params.commandName);
    if (!schema) return res.status(404).json({ error: 'Command not found' });
    res.json(schema);
  });

  app.get('/api/commands/:commandName/config', async (req, res) => {
    const guildId = req.query.guild;
    if (!guildId) return res.status(400).json({ error: 'Missing guild parameter' });
    
    try {
      const guildConfig = await getConfig(guildId);
      const schema = getCommandSchema(req.params.commandName);
      if (!schema) return res.status(404).json({ error: 'Command not found' });
      
      const cmdConfig = {};
      schema.fields.forEach(field => {
        cmdConfig[field.key] = guildConfig[field.key] !== undefined ? guildConfig[field.key] : field.default;
      });
      res.json({ config: cmdConfig, schema });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });

  app.post('/api/commands/:commandName/config', checkAuth, async (req, res) => {
    const guildId = req.query.guild;
    if (!guildId) return res.status(400).json({ error: 'Missing guild parameter' });

    try {
      const schema = getCommandSchema(req.params.commandName);
      if (!schema) return res.status(404).json({ error: 'Command not found' });

      // Validate and sanitize incoming config
      const updates = {};
      schema.fields.forEach(field => {
        if (req.body[field.key] !== undefined) {
          let value = req.body[field.key];
          
          if (field.type === 'toggle') {
            value = value === 'on' || value === 'true' || value === true;
          } else if (field.type === 'number') {
            value = parseInt(value, 10);
            if (field.min !== undefined) value = Math.max(value, field.min);
            if (field.max !== undefined) value = Math.min(value, field.max);
          }
          
          updates[field.key] = value;
        }
      });

      await updateConfig(guildId, updates);
      if (client && client._guildConfigCache) client._guildConfigCache.delete(`guild_${guildId}`);
      
      res.json({ success: true, config: updates });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });

  app.get('/api/stats', (req, res) => {
    res.json({
      guilds: client ? client.guilds.cache.size : 0,
      users: client ? client.users.cache.size : 0,
      commands: client ? client.commands.size : 0,
      uptime: Math.floor(process.uptime()),
      ping: client ? client.ws.ping : 0
    });
  });

  const port = config.dashboard.port || 10057;
  app.listen(port, '0.0.0.0', () => console.log(`[Dashboard] Running on port ${port}`));
};
