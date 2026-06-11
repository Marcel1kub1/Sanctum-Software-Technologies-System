const { ActionRowBuilder, ButtonBuilder, ButtonStyle, StringSelectMenuBuilder, ComponentType } = require('discord.js');

function buildControlPanel(channelId, config) {
  const allowRename = config.tempvoice_allow_rename !== false;
  const allowUserLimit = config.tempvoice_allow_user_limit !== false;
  const allowBitrate = config.tempvoice_allow_bitrate === true;
  const allowKick = config.tempvoice_allow_kick !== false;

  const buttons = [];
  const row = new ActionRowBuilder();

  if (allowRename) {
    row.addComponents(
      new ButtonBuilder()
        .setCustomId(`tempvoice_rename_${channelId}`)
        .setLabel('Rename')
        .setStyle(ButtonStyle.Secondary)
        .setEmoji('✏️')
    );
  }
  if (allowUserLimit) {
    row.addComponents(
      new ButtonBuilder()
        .setCustomId(`tempvoice_limit_${channelId}`)
        .setLabel('User Limit')
        .setStyle(ButtonStyle.Secondary)
        .setEmoji('👤')
    );
  }
  if (allowBitrate) {
    row.addComponents(
      new ButtonBuilder()
        .setCustomId(`tempvoice_bitrate_${channelId}`)
        .setLabel('Bitrate')
        .setStyle(ButtonStyle.Secondary)
        .setEmoji('🎚️')
    );
  }
  if (allowKick) {
    row.addComponents(
      new ButtonBuilder()
        .setCustomId(`tempvoice_kick_${channelId}`)
        .setLabel('Kick User')
        .setStyle(ButtonStyle.Danger)
        .setEmoji('🚪')
    );
  }

  return {
    embeds: [{
      title: '🎤 Your Temp Channel Controls',
      description: `Manage your channel <#${channelId}>`,
      color: 0xff00aa,
      footer: { text: 'Sanctum Temp Voice' }
    }],
    components: row.components.length > 0 ? [row] : []
  };
}

async function handleTempVoiceButton(bot, interaction) {
  const parts = interaction.customId.split('_');
  if (parts.length < 3) return;

  const action = parts[1];
  const channelId = parts.slice(2).join('_');

  const tempData = bot.tempVoiceChannels.get(channelId);
  if (!tempData) {
    return interaction.reply({ content: 'This channel is no longer tracked as a temporary channel.', ephemeral: true });
  }

  if (tempData.ownerId !== interaction.user.id) {
    return interaction.reply({ content: 'Only the channel owner can use these controls.', ephemeral: true });
  }

  const guild = bot.guilds.cache.get(tempData.guildId);
  if (!guild) return interaction.reply({ content: 'Guild not found.', ephemeral: true });

  const channel = guild.channels.cache.get(channelId);
  if (!channel) {
    bot.tempVoiceChannels.delete(channelId);
    return interaction.reply({ content: 'Channel no longer exists.', ephemeral: true });
  }

  switch (action) {
    case 'rename': {
      await interaction.showModal({
        title: 'Rename Your Channel',
        customId: `tempvoice_modal_rename_${channelId}`,
        components: [{
          type: ComponentType.ActionRow,
          components: [{
            type: ComponentType.TextInput,
            customId: 'new_name',
            label: 'New Channel Name',
            style: 1,
            maxLength: 100,
            value: channel.name
          }]
        }]
      });
      break;
    }
    case 'limit': {
      await interaction.showModal({
        title: 'Set User Limit',
        customId: `tempvoice_modal_limit_${channelId}`,
        components: [{
          type: ComponentType.ActionRow,
          components: [{
            type: ComponentType.TextInput,
            customId: 'user_limit',
            label: 'User Limit (0 = unlimited)',
            style: 1,
            maxLength: 2,
            value: String(channel.userLimit || 0)
          }]
        }]
      });
      break;
    }
    case 'bitrate': {
      const options = [
        { label: '64 kbps (Low)', value: '64000', description: 'Low quality' },
        { label: '96 kbps', value: '96000' },
        { label: '128 kbps (Standard)', value: '128000', description: 'Default quality' },
        { label: '192 kbps', value: '192000', description: 'High quality' },
        { label: '256 kbps', value: '256000', description: 'Very high quality' },
        { label: '384 kbps (Max)', value: '384000', description: 'Maximum quality (if boosted)' }
      ];

      const row = new ActionRowBuilder().addComponents(
        new StringSelectMenuBuilder()
          .setCustomId(`tempvoice_select_bitrate_${channelId}`)
          .setPlaceholder('Select bitrate')
          .addOptions(options)
      );

      await interaction.reply({
        content: 'Select a bitrate for your channel:',
        components: [row],
        ephemeral: true
      });
      break;
    }
    case 'kick': {
      const members = channel.members.filter(m => m.id !== interaction.user.id);
      if (members.size === 0) {
        return interaction.reply({ content: 'No other users in your channel to kick.', ephemeral: true });
      }

      const options = members.map(m => ({
        label: m.user.tag,
        value: m.id
      }));

      const row = new ActionRowBuilder().addComponents(
        new StringSelectMenuBuilder()
          .setCustomId(`tempvoice_select_kick_${channelId}`)
          .setPlaceholder('Select user to kick')
          .addOptions(options)
      );

      await interaction.reply({
        content: 'Select a user to kick from your channel:',
        components: [row],
        ephemeral: true
      });
      break;
    }
    default:
      await interaction.reply({ content: 'Unknown action.', ephemeral: true });
  }
}

async function handleTempVoiceModal(bot, interaction) {
  const parts = interaction.customId.split('_');
  if (parts.length < 4) return;

  const action = parts[2];
  const channelId = parts.slice(3).join('_');

  const tempData = bot.tempVoiceChannels.get(channelId);
  if (!tempData || tempData.ownerId !== interaction.user.id) {
    return interaction.reply({ content: 'You are not the owner of this channel or it no longer exists.', ephemeral: true });
  }

  const guild = bot.guilds.cache.get(tempData.guildId);
  if (!guild) return interaction.reply({ content: 'Guild not found.', ephemeral: true });

  const channel = guild.channels.cache.get(channelId);
  if (!channel) {
    bot.tempVoiceChannels.delete(channelId);
    return interaction.reply({ content: 'Channel no longer exists.', ephemeral: true });
  }

  switch (action) {
    case 'rename': {
      const newName = interaction.fields.getTextInputValue('new_name').trim();
      if (!newName || newName.length > 100) {
        return interaction.reply({ content: 'Invalid name (1-100 characters).', ephemeral: true });
      }
      await channel.setName(newName, 'Temp voice rename');
      await interaction.reply({ content: `Channel renamed to **${newName}**.`, ephemeral: true });
      break;
    }
    case 'limit': {
      const limit = parseInt(interaction.fields.getTextInputValue('user_limit'));
      if (isNaN(limit) || limit < 0 || limit > 99) {
        return interaction.reply({ content: 'Invalid limit (0-99).', ephemeral: true });
      }
      await channel.setUserLimit(limit, 'Temp voice user limit change');
      await interaction.reply({ content: `User limit set to ${limit || 'unlimited'}.`, ephemeral: true });
      break;
    }
    default:
      await interaction.reply({ content: 'Unknown action.', ephemeral: true });
  }
}

async function handleTempVoiceSelect(bot, interaction) {
  const parts = interaction.customId.split('_');
  if (parts.length < 4) return;

  const action = parts[2];
  const channelId = parts.slice(3).join('_');

  if (!interaction.values || interaction.values.length === 0) return;

  const tempData = bot.tempVoiceChannels.get(channelId);
  if (!tempData || tempData.ownerId !== interaction.user.id) {
    return interaction.update({ content: 'You are not the owner of this channel.', components: [], ephemeral: true });
  }

  const guild = bot.guilds.cache.get(tempData.guildId);
  if (!guild) return interaction.update({ content: 'Guild not found.', components: [], ephemeral: true });

  const channel = guild.channels.cache.get(channelId);
  if (!channel) {
    bot.tempVoiceChannels.delete(channelId);
    return interaction.update({ content: 'Channel no longer exists.', components: [], ephemeral: true });
  }

  switch (action) {
    case 'bitrate': {
      const bitrate = parseInt(interaction.values[0]);
      const maxBitrate = guild.maximumBitrate;
      const capped = Math.min(bitrate, maxBitrate);
      await channel.setBitrate(capped, 'Temp voice bitrate change');
      await interaction.update({ content: `Bitrate set to ${capped / 1000} kbps.`, components: [], ephemeral: true });
      break;
    }
    case 'kick': {
      const targetId = interaction.values[0];
      const target = channel.members.get(targetId);
      if (!target) {
        return interaction.update({ content: 'That user is no longer in your channel.', components: [], ephemeral: true });
      }
      await target.voice.disconnect('Kicked from temp voice channel');
      await interaction.update({ content: `Kicked **${target.user.tag}** from your channel.`, components: [], ephemeral: true });
      break;
    }
    default:
      await interaction.update({ content: 'Unknown action.', components: [], ephemeral: true });
  }
}

module.exports = { buildControlPanel, handleTempVoiceButton, handleTempVoiceModal, handleTempVoiceSelect };
