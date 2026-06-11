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

    res.render('dashboard', {
      config: config.dashboard,
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
      const b1 = guildCfg.tickets_button_1_label || 'Commission';
      const b2 = guildCfg.tickets_button_2_label || 'Apply';
      const b3 = guildCfg.tickets_button_3_label || 'Support';

      const embed = new EmbedBuilder().setTitle(title).setDescription(desc).setColor(0x11111);
      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId(`ticket_panel_${guild}_1`).setLabel(b1).setStyle(ButtonStyle.Primary),
        new ButtonBuilder().setCustomId(`ticket_panel_${guild}_2`).setLabel(b2).setStyle(ButtonStyle.Secondary),
        new ButtonBuilder().setCustomId(`ticket_panel_${guild}_3`).setLabel(b3).setStyle(ButtonStyle.Secondary)
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
