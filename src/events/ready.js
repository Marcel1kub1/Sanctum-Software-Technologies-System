const { ActivityType } = require('discord.js');
const { registerSlashCommands } = require('../handlers/commandHandler');
const setupMusicHandler = require('../handlers/musicHandler');
const { startMusicServices } = require('../music');
const { checkGiveaways } = require('../handlers/giveawayHandler');

module.exports = {
  name: 'ready',
  once: true,
  async execute(bot) {
    console.log(`[Bot] Logged in as ${bot.user.tag}`);
    console.log(`[Bot] Serving ${bot.guilds.cache.size} guilds`);

    bot.user.setPresence({
      activities: [{
        name: bot.config.bot.activity.text,
        type: ActivityType[bot.config.bot.activity.type]
      }],
      status: bot.config.bot.status
    });

    if (bot.config.music.enabled && bot.config.music.engine === 'lavalink' && bot.lavalink) {
      try {
        bot.lavalink.init();
        setupMusicHandler(bot);
        startMusicServices(bot);
      } catch (e) {
        console.warn('[Lavalink] Failed to initialize:', e.message);
      }
    }

    await registerSlashCommands(bot);

    setInterval(() => checkGiveaways(bot), 30000);
  }
};
