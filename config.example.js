module.exports = {
  bot: {
    token: 'YOUR_BOT_TOKEN_HERE',
    clientId: 'YOUR_CLIENT_ID_HERE',
    clientSecret: 'YOUR_CLIENT_SECRET_HERE',
    prefix: '!',
    status: 'online',
    activity: {
      type: 'PLAYING',
      text: '/help | Sanctum Technologies'
    }
  },

  database: {
    host: 'YOUR_DB_HOST_HERE',
    port: 3306,
    user: 'YOUR_DB_USER_HERE',
    password: 'YOUR_DB_PASSWORD_HERE',
    database: 'YOUR_DB_NAME_HERE',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
  },

  dashboard: {
    enabled: true,
    port: 10057,
    url: 'http://localhost:10057',
    sessionSecret: 'YOUR_SESSION_SECRET_HERE',
    botInvite: 'https://discord.com/api/oauth2/authorize?client_id=YOUR_CLIENT_ID_HERE&response_type=code&redirect_uri=http%3A%2F%2Flocalhost%3A10057%2Fauth%2Fcallback&integration_type=0&scope=connections+guilds.members.read+guilds+guilds.channels.read+identify+applications.commands',
    supportServer: 'https://discord.gg/YOUR_SERVER_HERE'
  },

  music: {
    enabled: true,
    engine: 'lavalink',
    lavalink: {
      host: 'YOUR_LAVALINK_HOST_HERE',
      port: 6004,
      password: 'YOUR_LAVALINK_PASSWORD_HERE',
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

  ownerID: 'YOUR_OWNER_ID_HERE',
  supportGuildID: 'YOUR_SUPPORT_GUILD_ID_HERE',
  debug: false
};
