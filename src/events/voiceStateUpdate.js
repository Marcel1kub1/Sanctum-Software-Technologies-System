const { ChannelType, PermissionsBitField } = require('discord.js');
const { getConfig } = require('../database/guildConfig');
const { buildControlPanel } = require('../handlers/tempVoiceHandler');

module.exports = {
  name: 'voiceStateUpdate',
  async execute(bot, oldState, newState) {
    const guildId = newState.guild?.id || oldState.guild?.id;
    if (!guildId) return;

    const guildConfig = await bot.guildConfig(guildId);
    if (!guildConfig || !guildConfig.tempvoice_enabled) return;

    const interfaceId = guildConfig.tempvoice_interface_channel;
    if (!interfaceId) return;

    const joinedChannel = newState.channelId;
    const leftChannel = oldState.channelId;

    if (joinedChannel === interfaceId) {
      const guild = newState.guild;
      const member = newState.member;
      if (!guild || !member) return;

      const categoryId = guildConfig.tempvoice_category || null;
      const nameFormat = guildConfig.tempvoice_channel_name_format || "{user}'s Channel";
      const userLimit = parseInt(guildConfig.tempvoice_user_limit) || 0;

      const count = Array.from(bot.tempVoiceChannels.values()).filter(c => c.guildId === guildId).length + 1;
      const channelName = nameFormat.replace(/\{user\}/g, member.displayName).replace(/\{count\}/g, count);

      try {
        const channel = await guild.channels.create({
          name: channelName,
          type: ChannelType.GuildVoice,
          parent: categoryId,
          userLimit: userLimit,
          permissionOverwrites: [
            {
              id: guild.roles.everyone.id,
              allow: [PermissionsBitField.Flags.Connect],
              deny: [PermissionsBitField.Flags.ManageChannels]
            },
            {
              id: member.id,
              allow: [
                PermissionsBitField.Flags.ManageChannels,
                PermissionsBitField.Flags.MuteMembers,
                PermissionsBitField.Flags.DeafenMembers,
                PermissionsBitField.Flags.MoveMembers
              ]
            }
          ]
        });

        bot.tempVoiceChannels.set(channel.id, {
          guildId,
          ownerId: member.id,
          ownerTag: member.user.tag,
          channelId: channel.id,
          createdAt: Date.now()
        });

        await member.voice.setChannel(channel);

        try {
          const panel = buildControlPanel(channel.id, guildConfig);
          await member.send(panel);
        } catch {
          /* DMs may be disabled */
        }
      } catch (err) {
        console.error(`[TempVoice] Failed to create channel for ${member.user.tag}:`, err.message);
      }
    }

    if (leftChannel && leftChannel !== interfaceId && guildConfig.tempvoice_auto_delete_empty !== false) {
      const tempData = bot.tempVoiceChannels.get(leftChannel);
      if (!tempData) return;

      const guild = oldState.guild || newState.guild;
      if (!guild) return;

      const channel = guild.channels.cache.get(leftChannel);
      if (!channel) {
        bot.tempVoiceChannels.delete(leftChannel);
        return;
      }

      const members = channel.members;
      if (members.size === 0) {
        try {
          await channel.delete('Temp voice channel empty');
          bot.tempVoiceChannels.delete(leftChannel);
        } catch (err) {
          console.error(`[TempVoice] Failed to delete empty channel ${leftChannel}:`, err.message);
        }
      }
    }
  }
};
