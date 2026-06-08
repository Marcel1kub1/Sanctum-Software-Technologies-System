const express = require('express');
const session = require('express-session');
const path = require('path');

const app = express();
const PORT = 3000;

// Mock config
const config = {
  url: `http://localhost:${PORT}`,
  botInvite: '#',
  supportServer: '#',
  sessionSecret: 'test-secret-123'
};

// Mock data
const mockChannels = [
  { id: '2001', name: 'welcome', type: 'text', position: 0 },
  { id: '2002', name: 'rules', type: 'text', position: 1 },
  { id: '2003', name: 'announcements', type: 'announcement', position: 2 },
  { id: '2004', name: 'general', type: 'text', position: 3 },
  { id: '2005', name: 'community', type: 'text', position: 4 },
  { id: '2006', name: 'media', type: 'text', position: 5 },
  { id: '2007', name: 'bot-commands', type: 'text', position: 6 },
  { id: '2008', name: 'support', type: 'text', position: 7 },
  { id: '2009', name: 'suggestions', type: 'text', position: 8 },
  { id: '2010', name: 'staff-chat', type: 'text', position: 9 },
  { id: '2011', name: 'mod-logs', type: 'text', position: 10 },
  { id: '2012', name: 'admin-chat', type: 'text', position: 11 },
  { id: '2013', name: 'message-logs', type: 'text', position: 12 },
  { id: '2014', name: 'member-logs', type: 'text', position: 13 },
  { id: '2015', name: 'ticket-logs', type: 'text', position: 14 },
  { id: '2016', name: 'join-logs', type: 'text', position: 15 },
  { id: '2017', name: 'level-up', type: 'text', position: 16 },
  { id: '2018', name: 'giveaways', type: 'text', position: 17 },
  { id: '2019', name: 'music-requests', type: 'text', position: 18 },
  { id: '2020', name: 'open-ticket', type: 'text', position: 19 },
  { id: '2101', name: 'General', type: 'category', position: 0 },
  { id: '2102', name: 'Community', type: 'category', position: 1 },
  { id: '2103', name: 'Staff', type: 'category', position: 2 },
  { id: '2201', name: 'General VC', type: 'voice', position: 0 },
  { id: '2202', name: 'Music VC', type: 'voice', position: 1 },
  { id: '2203', name: 'Staff VC', type: 'voice', position: 2 },
  { id: '2204', name: 'AFK', type: 'voice', position: 3 }
];

const mockRoles = [
  { id: '3001', name: 'Admin', color: '#ef4444', position: 10 },
  { id: '3002', name: 'Moderator', color: '#f59e0b', position: 9 },
  { id: '3003', name: 'Support', color: '#22c55e', position: 8 },
  { id: '3004', name: 'DJ', color: '#8b5cf6', position: 7 },
  { id: '3005', name: 'Verified', color: '#3b82f6', position: 6 },
  { id: '3006', name: 'Member', color: '#6b7280', position: 5 },
  { id: '3007', name: 'Muted', color: '#6b7280', position: 4 },
  { id: '3008', name: 'Bot', color: '#5865f2', position: 3 }
];

const mockGuilds = [
  {
    id: '123456789', name: 'Sanctum Technologies HQ', icon: null, memberCount: 1280,
    channels: mockChannels, textChannels: mockChannels.filter(c => c.type === 'text' || c.type === 'announcement'),
    voiceChannels: mockChannels.filter(c => c.type === 'voice'),
    categories: mockChannels.filter(c => c.type === 'category'),
    roles: mockRoles, ownerId: '111111111111111111',
    createdAt: new Date('2023-01-15'), premiumTier: 2, premiumSubscriberCount: 42,
    verificationLevel: 'Low', explicitContentFilter: 'AllMembers', mfaLevel: 'None',
    defaultMessageNotifications: 'AllMessages'
  },
  {
    id: '123456790', name: 'Development Server', icon: null, memberCount: 342,
    channels: mockChannels, textChannels: mockChannels.filter(c => c.type === 'text' || c.type === 'announcement'),
    voiceChannels: mockChannels.filter(c => c.type === 'voice'),
    categories: mockChannels.filter(c => c.type === 'category'),
    roles: mockRoles, ownerId: '111111111111111111',
    createdAt: new Date('2024-06-01'), premiumTier: 0, premiumSubscriberCount: 3,
    verificationLevel: 'None', explicitContentFilter: 'Disabled', mfaLevel: 'None',
    defaultMessageNotifications: 'AllMessages'
  },
  {
    id: '123456791', name: 'Community Lounge', icon: null, memberCount: 891,
    channels: mockChannels, textChannels: mockChannels.filter(c => c.type === 'text' || c.type === 'announcement'),
    voiceChannels: mockChannels.filter(c => c.type === 'voice'),
    categories: mockChannels.filter(c => c.type === 'category'),
    roles: mockRoles, ownerId: '222222222222222222',
    createdAt: new Date('2024-03-20'), premiumTier: 1, premiumSubscriberCount: 15,
    verificationLevel: 'Low', explicitContentFilter: 'MembersWithoutRoles', mfaLevel: 'None',
    defaultMessageNotifications: 'OnlyMentions'
  }
];

const mockUser = {
  id: '111111111111111111',
  username: 'TestUser',
  discriminator: '0001',
  avatar: null
};

const mockStats = {
  guilds: 3,
  users: 2513,
  commands: 24,
  uptime: 125000,
  ping: 42
};

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, '..', 'dashboard', 'views'));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(session({
  secret: config.sessionSecret,
  resave: false,
  saveUninitialized: false
}));

// Fake auth middleware — always logged in
app.use((req, res, next) => {
  req.user = mockUser;
  next();
});

app.get('/', (req, res) => {
  res.render('index', { config, stats: mockStats, user: req.user });
});

// In-memory guild config store
const guildConfigs = new Map();

app.get('/dashboard', (req, res) => {
  const tab = req.query.tab || 'overview';
  const guildId = req.query.guild;
  let selectedGuild = null;

  if (guildId) {
    selectedGuild = mockGuilds.find(g => g.id === guildId) || null;
  }
  if (!selectedGuild) selectedGuild = mockGuilds[0];

  const guildConfig = selectedGuild ? (guildConfigs.get(selectedGuild.id) || {}) : {};

  res.render('dashboard', {
    config,
    stats: mockStats,
    user: req.user,
    guilds: mockGuilds,
    selectedGuild,
    tab,
    guildConfig
  });
});

app.post('/dashboard/config', (req, res) => {
  const { guild } = req.query;
  if (!guild) return res.status(400).send('Missing guild parameter');

  const existing = guildConfigs.get(guild) || {};
  const sanitized = {};
  for (const [key, val] of Object.entries(req.body)) {
    if (val === 'on' || val === 'true') sanitized[key] = true;
    else if (val === 'off' || val === 'false') sanitized[key] = false;
    else sanitized[key] = val;
  }

  guildConfigs.set(guild, { ...existing, ...sanitized });
  console.log(`[Standalone] Config saved for guild ${guild}:`, sanitized);
  res.redirect(req.get('Referer') || `/dashboard?guild=${guild}`);
});

app.get('/api/guild-config', (req, res) => {
  const { guild } = req.query;
  res.json(guild ? (guildConfigs.get(guild) || {}) : Object.fromEntries(guildConfigs));
});

app.get('/logout', (req, res) => {
  req.session.destroy(() => res.redirect('/'));
});

app.get('/api/stats', (req, res) => {
  res.json(mockStats);
});

app.listen(PORT, '0.0.0.0', () => {
  console.log('==========================================');
  console.log('  Sanctum Technologies - Dashboard (Standalone)');
  console.log('  Running on http://localhost:' + PORT);
  console.log('  No Discord bot required');
  console.log('==========================================');
});
