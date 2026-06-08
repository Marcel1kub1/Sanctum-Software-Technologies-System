const config = require('../../config');
const { executeCommand } = require('../handlers/executeHandler');

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

    await executeCommand(bot, command, 'prefix', { message, args });
  }
};
