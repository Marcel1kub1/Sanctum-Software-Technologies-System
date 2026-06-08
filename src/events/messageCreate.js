const config = require('../../config');

module.exports = {
  name: 'messageCreate',
  async execute(bot, message) {
    if (message.author.bot) return;

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
      message.reply('An error occurred while executing that command.');
    }
  }
};
