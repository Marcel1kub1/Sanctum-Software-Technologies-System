const config = require('../../config');

const processedMessages = new Set();
setInterval(() => processedMessages.clear(), 10000);

module.exports = {
  name: 'messageCreate',
  async execute(bot, message) {
    if (message.author.bot) return;
    if (processedMessages.has(message.id)) return;
    processedMessages.add(message.id);

    const prefix = config.bot.prefix;
    if (!message.content.startsWith(prefix)) return;

    const args = message.content.slice(prefix.length).trim().split(/ +/);
    const commandName = args.shift().toLowerCase();

    const command = bot.commands.get(commandName);
    if (!command) return;

    try {
      await command.execute(bot, message, args);
    } catch (err) {
      console.error(`[Error] Command ${commandName}:`, err.message);
      message.reply('An error occurred while executing that command.').catch(() => {});
    }
  }
};
