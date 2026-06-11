const { getConfig } = require('../database/guildConfig');
const { sendLog, isExcluded } = require('../handlers/loggingHandler');

module.exports = {
  name: 'messageUpdate',
  async execute(bot, oldMessage, newMessage) {
    if (oldMessage.author?.bot) return;
    if (!oldMessage.guild) return;
    if (oldMessage.content === newMessage.content) return;
    if (!oldMessage.content && !newMessage.content) return;

    const guildConfig = await bot.guildConfig(oldMessage.guild.id);
    if (!guildConfig || !guildConfig.logging_enabled) return;
    if (guildConfig.logging_messageedit === false) return;
    if (isExcluded(guildConfig, oldMessage.channel.id)) return;

    await sendLog(oldMessage.guild, guildConfig, 'message', {
      color: 0xffaa00,
      title: 'Message Edited',
      fields: [
        { name: 'Author', value: `${oldMessage.author} (${oldMessage.author.id})`, inline: true },
        { name: 'Channel', value: `<#${oldMessage.channel.id}>`, inline: true },
        { name: 'Before', value: (oldMessage.content || '[empty]').substring(0, 1024) },
        { name: 'After', value: (newMessage.content || '[empty]').substring(0, 1024) }
      ]
    });
  }
};
