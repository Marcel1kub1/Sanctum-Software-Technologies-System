const { EmbedBuilder } = require('discord.js');
const { getConfig } = require('../database/guildConfig');
const { sendLog } = require('../handlers/loggingHandler');

module.exports = {
  name: 'guildMemberAdd',
  async execute(bot, member) {
    if (member.user.bot) return;

    const guildConfig = await bot.guildConfig(member.guild.id);
    if (!guildConfig || !guildConfig.logging_enabled) return;
    if (guildConfig.logging_memberjoin === false) return;

    const createdAgo = Math.floor((Date.now() - member.user.createdTimestamp) / 86400000);
    const isNewAccount = createdAgo < 7;

    await sendLog(member.guild, guildConfig, 'member', {
      color: 0x44ff88,
      title: 'Member Joined',
      author: { name: member.user.tag, iconURL: member.user.displayAvatarURL() },
      fields: [
        { name: 'User', value: `${member.user} (${member.user.id})`, inline: true },
        { name: 'Account Age', value: `${createdAgo} days${isNewAccount ? ' ⚠️ New' : ''}`, inline: true },
        { name: 'Member Count', value: `${member.guild.memberCount}`, inline: true }
      ]
    });
  }
};
