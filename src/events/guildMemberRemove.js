const { getConfig } = require('../database/guildConfig');
const { sendLog } = require('../handlers/loggingHandler');

module.exports = {
  name: 'guildMemberRemove',
  async execute(bot, member) {
    if (member.user.bot) return;

    const guildConfig = await bot.guildConfig(member.guild.id);
    if (!guildConfig || !guildConfig.logging_enabled) return;
    if (guildConfig.logging_memberleave === false) return;

    await sendLog(member.guild, guildConfig, 'member', {
      color: 0xff6644,
      title: 'Member Left',
      author: { name: member.user.tag, iconURL: member.user.displayAvatarURL() },
      fields: [
        { name: 'User', value: `${member.user} (${member.user.id})`, inline: true },
        { name: 'Joined', value: member.joinedAt ? `<t:${Math.floor(member.joinedAt.getTime() / 1000)}:R>` : 'Unknown', inline: true },
        { name: 'Member Count', value: `${member.guild.memberCount}`, inline: true }
      ]
    });
  }
};
