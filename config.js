module.exports = {
  bot: {
    token: process.env.BOT_TOKEN || 'YOUR_BOT_TOKEN_HERE',
    clientId: process.env.CLIENT_ID || 'YOUR_CLIENT_ID_HERE',
    clientSecret: process.env.CLIENT_SECRET || 'YOUR_CLIENT_SECRET_HERE',
    prefix: process.env.PREFIX || '!',
    status: 'online',
    activity: {
      type: 'PLAYING',
      text: '/help | Sanctum Technologies'
    }
  },

  database: {
    host: process.env.DB_HOST || 'db2.vortexspace.one',
    port: parseInt(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER || 'u48_oQ3cFBGfIz',
    password: process.env.DB_PASSWORD || 'muJX!B.R4IxP@RUTw4KOYGrB',
    database: process.env.DB_NAME || 's48_New_System',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
  },

  dashboard: {
    enabled: true,
    port: parseInt(process.env.DASHBOARD_PORT) || 10057,
    url: process.env.DASHBOARD_URL || 'http://localhost:10057',
    sessionSecret: process.env.SESSION_SECRET || '08771616896cdfef70c4ab4768ef1bd0',
    botInvite: process.env.BOT_INVITE || 'https://discord.com/oauth2/authorize?client_id=1511800635836862525&response_type=code&redirect_uri=http%3A%2F%2Flocalhost%3A10057%2Fauth%2Fcallback&integration_type=0&scope=connections+guilds.members.read+guilds+guilds.channels.read+identify+applications.commands',
    supportServer: process.env.SUPPORT_SERVER || 'https://discord.gg/disabled'
  },

  modLog: {
    enabled: true,
    channelName: 'mod-logs'
  },

music: {
    enabled: true,
    defaultVolume: 50,
    maxQueueSize: 200,
    timeout: 300000
  },

	 music: {
    enabled: true,
    engine: 'lavalink',
    lavalink: {
      host: 'lava1.mineserver.it',
      port: 6004,
      password: 'discord.vortexspace.one',
      ssl: false,
      autoResume: true
    },
    defaultVolume: 50,
    maxQueueSize: 500,
    playbackHistoryLimit: 50,
    maxSongDuration: 0,
    inactivityTimeout: 300000,
    bufferSize: 'medium',
    sources: {
      youtube: true,
      soundcloud: true
    },
    searchDefault: 'ytmsearch',
    defaultLoopMode: 'off',
    allowLoopTrack: true,
    allowLoopQueue: true,
    autoplay: false,
    lyrics: {
      enabled: false,
      provider: 'genius',
      geniusToken: ''
    },
    localApi: {
      enabled: false,
      port: 7788,
      apiKey: ''
    },
    defaultLanguage: 'en',
    perUserLanguage: true,
    showQueueOnAdd: false,
    djRoleRequired: false,
    djRole: '',
    voteSkip: false,
    votePercentage: 50,
    allowedVoiceChannels: ''
  },
	
  economy: {
    enabled: true,
    currency: '\uD83D\uDCB0',
    dailyAmount: 100,
    workMin: 10,
    workMax: 100,
    startingBalance: 500
  },

  tickets: {
    enabled: true,
    categoryName: 'Tickets',
    ticketLimit: 5
  },

  giveaways: {
    enabled: true,
    minDuration: 10000,
    maxWinners: 20
  },

  welcome: {
    enabled: true,
    defaultWelcomeMessage: 'Welcome {user} to {server}!',
    defaultGoodbyeMessage: '{user} has left the server.'
  },

  leveling: {
    enabled: true,
    xpPerMessage: 15,
    xpCooldown: 60000,
    baseXP: 100,
    xpMultiplier: 1.5
  },

  security: {
    enabled: true,
    maxMentions: 5,
    maxLinks: 3,
    antiSpam: {
      enabled: true,
      maxMessages: 5,
      interval: 3000,
      muteDuration: 60000
    }
  },

  ownerID: process.env.OWNER_ID || '1263166644868481117',
  supportGuildID: process.env.SUPPORT_GUILD_ID || '1511317798859833434',
  debug: process.env.DEBUG === 'true'
};
