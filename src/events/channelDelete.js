const { ChannelType } = require('discord.js');
const { getConfig } = require('../database/guildConfig');
const { sendLog } = require('../handlers/loggingHandler');

module.exports = {
  name: 'channelDelete',
  async execute(bot, channel) {
    if (channel.type === ChannelType.DM) return;
    const guildConfig = await bot.guildConfig(channel.guild.id);
    if (!guildConfig || !guildConfig.logging_enabled) return;
    if (guildConfig.logging_channelchanges === false) return;

    await sendLog(channel.guild, guildConfig, 'mod', {
      color: 0xff6644,
      title: 'Channel Deleted',
      fields: [
        { name: 'Name', value: `${channel.name} (${channel.id})`, inline: true },
        { name: 'Type', value: ChannelType[channel.type] || channel.type, inline: true }
      ]
    });
  }
};
