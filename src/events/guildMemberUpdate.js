const { getConfig } = require('../database/guildConfig');
const { sendLog } = require('../handlers/loggingHandler');

module.exports = {
  name: 'guildMemberUpdate',
  async execute(bot, oldMember, newMember) {
    const guildConfig = await bot.guildConfig(newMember.guild.id);
    if (!guildConfig || !guildConfig.logging_enabled) return;

    const addedRoles = newMember.roles.cache.filter(r => !oldMember.roles.cache.has(r.id) && r.id !== newMember.guild.id);
    const removedRoles = oldMember.roles.cache.filter(r => !newMember.roles.cache.has(r.id) && r.id !== newMember.guild.id);

    if (addedRoles.size > 0) {
      await sendLog(newMember.guild, guildConfig, 'member', {
        color: 0x44ff88,
        title: 'Role Added',
        fields: [
          { name: 'User', value: `${newMember.user} (${newMember.user.id})`, inline: true },
          { name: 'Role', value: addedRoles.map(r => r.name).join(', '), inline: true }
        ]
      });
    }

    if (removedRoles.size > 0) {
      await sendLog(newMember.guild, guildConfig, 'member', {
        color: 0xff6644,
        title: 'Role Removed',
        fields: [
          { name: 'User', value: `${newMember.user} (${newMember.user.id})`, inline: true },
          { name: 'Role', value: removedRoles.map(r => r.name).join(', '), inline: true }
        ]
      });
    }
  }
};
