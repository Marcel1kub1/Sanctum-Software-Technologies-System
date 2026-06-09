const express = require('express');
const session = require('express-session');
const passport = require('passport');
const DiscordStrategy = require('passport-discord').Strategy;
const path = require('path');
const config = require('../config');
const { getConfig, updateConfig } = require('../src/database/guildConfig');
const { ChannelType } = require('discord.js');
const db = require('../src/database/connection');
const { sendPanel } = require('../src/handlers/rolePanelHandler');

module.exports = (client) => {
  const app = express();

  app.set('view engine', 'ejs');
  app.set('views', path.join(__dirname, 'views'));
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
      guildConfig
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

  app.get('/logout', (req, res) => {
    req.logout(() => res.redirect('/'));
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
