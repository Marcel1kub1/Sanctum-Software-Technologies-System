const { EmbedBuilder } = require('discord.js');

async function sendLog(guild, config, logType, embedData) {
  if (!config || !config.logging_enabled) return;

  let channelId = null;
  if (logType === 'message' || logType === 'messageEdit' || logType === 'messageDelete') {
    channelId = config.logging_messagelogs || config.logging_channel;
  } else if (logType === 'member' || logType === 'memberJoin' || logType === 'memberLeave') {
    channelId = config.logging_memberlogs || config.logging_member_channel || config.logging_channel;
  } else if (logType === 'mod' || logType === 'moderation') {
    channelId = config.logging_modlogs || config.logging_mod_channel || config.logging_channel;
  } else {
    channelId = config.logging_channel;
  }

  if (!channelId) return;

  const channel = guild.channels.cache.get(channelId);
  if (!channel) return;

  const embed = new EmbedBuilder()
    .setColor(embedData.color || 0x00ccff)
    .setTimestamp();

  if (embedData.title) embed.setTitle(embedData.title);
  if (embedData.description) embed.setDescription(embedData.description);
  if (embedData.fields) embed.addFields(embedData.fields);
  if (embedData.author) embed.setAuthor(embedData.author);
  if (embedData.footer) embed.setFooter(embedData.footer);
  if (embedData.thumbnail) embed.setThumbnail(embedData.thumbnail);

  try {
    await channel.send({ embeds: [embed] });
  } catch {
    /* ignore send errors */
  }
}

function isExcluded(config, channelId) {
  return config[`logging_exclude_${channelId}`] === true;
}

module.exports = { sendLog, isExcluded };
