const { Client, GatewayIntentBits, Partials, Collection } = require('discord.js');
const config = require('../config');
const { loadCommands } = require('./handlers/commandHandler');
const { loadEvents } = require('./handlers/eventHandler');
const LavalinkManager = require('./structures/LavalinkManager');
const setupMusicHandler = require('./handlers/musicHandler');

class Bot extends Client {
  constructor() {
    super({
      intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildPresences,
        GatewayIntentBits.GuildVoiceStates,
        GatewayIntentBits.GuildMessageReactions,
        GatewayIntentBits.GuildMessageTyping,
        GatewayIntentBits.DirectMessages,
        GatewayIntentBits.DirectMessageReactions,
        GatewayIntentBits.DirectMessageTyping,
        GatewayIntentBits.GuildEmojisAndStickers,
        GatewayIntentBits.GuildIntegrations,
        GatewayIntentBits.GuildWebhooks,
        GatewayIntentBits.GuildInvites,
        GatewayIntentBits.GuildScheduledEvents,
        GatewayIntentBits.AutoModerationConfiguration,
        GatewayIntentBits.AutoModerationExecution
      ],
      partials: [
        Partials.Message,
        Partials.Channel,
        Partials.Reaction,
        Partials.User,
        Partials.GuildMember,
        Partials.ThreadMember
      ]
    });

    this.config = config;
    this.commands = new Collection();
    this.slashCommands = new Collection();
    this.cooldowns = new Collection();
    this.queues = new Collection();
    this.tempBans = new Collection();
    this.lavalink = new LavalinkManager(this);

    loadCommands(this);
    loadEvents(this);
  }

  async login() {
    return super.login(this.config.bot.token);
  }
}

module.exports = Bot;
