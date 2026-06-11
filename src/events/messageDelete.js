const { getConfig } = require('../database/guildConfig');
const { sendLog, isExcluded } = require('../handlers/loggingHandler');

module.exports = {
  name: 'messageDelete',
  async execute(bot, message) {
    if (message.author?.bot) return;
    if (!message.guild) return;
    if (!message.content && message.attachments.size === 0) return;

    const guildConfig = await bot.guildConfig(message.guild.id);
    if (!guildConfig || !guildConfig.logging_enabled) return;
    if (guildConfig.logging_messagedelete === false) return;
    if (isExcluded(guildConfig, message.channel.id)) return;

    const content = message.content || '[No text content]';
    await sendLog(message.guild, guildConfig, 'message', {
      color: 0xff6644,
      title: 'Message Deleted',
      fields: [
        { name: 'Author', value: `${message.author} (${message.author.id})`, inline: true },
        { name: 'Channel', value: `<#${message.channel.id}>`, inline: true },
        { name: 'Content', value: content.substring(0, 1024) }
      ]
    });
  }
};
