const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const axios = require('axios');

function formatTime(ms) {
  if (!ms || isNaN(ms)) return '0:00';
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  if (hours > 0) return `${hours}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  return `${minutes}:${String(seconds).padStart(2, '0')}`;
}

function buildProgressBar(current, total, length = 16) {
  if (!total || total <= 0) return '━'.repeat(length);
  const progress = Math.min(Math.max(current / total, 0), 1);
  const filled = Math.round(progress * length);
  return '█'.repeat(filled) + '░'.repeat(length - filled);
}

function buildNowPlayingEmbed(bot, guildId) {
  const queue = bot.lavalink.getQueue(guildId);
  const status = bot.lavalink.getStatus(guildId);
  const player = bot.lavalink.shoukaku?.players?.get(guildId);

  const track = status.current;
  const paused = player?.paused || false;

  const embed = new EmbedBuilder()
    .setColor(0x00E5FF)
    .setTitle('🎵 Music Player')
    .setTimestamp();

  if (track) {
    const pos = player?.position || 0;
    const total = track.info.length || 0;
    const bar = buildProgressBar(pos, total);
    const duration = `${formatTime(pos)} ${bar} ${formatTime(total)}`;

    const requester = track.requester ? `<@${track.requester}>` : 'Unknown';
    const loopIcon = status.loop === 'track' ? '🔂' : status.loop === 'queue' ? '🔁' : status.autoplay ? '♾️' : '➡️';
    const loopLabel = status.loop === 'autoplay' ? 'Autoplay' : status.loop === 'track' ? 'Track' : status.loop === 'queue' ? 'Queue' : 'Off';

    embed.setDescription(
      `**${track.info.title}**\n${track.info.author || ''}\n\n` +
      `${paused ? '⏸' : '▶️'} ${duration}`
    );

    if (track.info.uri) embed.setURL(track.info.uri);
    if (track.info.artworkUrl) embed.setThumbnail(track.info.artworkUrl);

    embed.addFields(
      { name: 'Requester', value: requester, inline: true },
      { name: 'Volume', value: `${status.volume}%`, inline: true },
      { name: 'Shuffle', value: status.shuffled ? '🔀 On' : '❌ Off', inline: true },
      { name: 'Loop', value: `${loopIcon} ${loopLabel}`, inline: true },
      { name: 'Status', value: paused ? '⏸ Paused' : '▶️ Playing', inline: true }
    );
  } else {
    embed.setDescription('Add a song to start listening!');
  }

  return embed;
}

function buildQueueEmbed(bot, guildId) {
  const queue = bot.lavalink.getQueue(guildId);
  const status = bot.lavalink.getStatus(guildId);
  const tracks = queue.tracks;

  const embed = new EmbedBuilder()
    .setColor(0x9B59B6)
    .setTitle('Up Next')
    .setTimestamp();

  if (tracks.length > 0) {
    const list = tracks.slice(0, 10).map((t, i) =>
      `\`${i + 1}.\` **${t.info.title}** — ${t.info.author} \`[${formatTime(t.info.length)}]\``
    ).join('\n');
    const value = tracks.length > 10
      ? `${list}\n\n*… and ${tracks.length - 10} more tracks*`
      : list;
    embed.setDescription(value);
  } else if (status.current) {
    embed.setDescription('No more tracks in queue.');
  } else {
    embed.setDescription('Queue is empty.');
  }

  return embed;
}

function buildControlRows(guildId, paused) {
  const cid = (action) => `music_panel_${guildId}_${action}`;

  const row1 = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId(cid('prev')).setEmoji('⏮').setStyle(ButtonStyle.Secondary),
    new ButtonBuilder().setCustomId(cid('playpause')).setEmoji(paused ? '▶️' : '⏸').setStyle(paused ? ButtonStyle.Success : ButtonStyle.Primary),
    new ButtonBuilder().setCustomId(cid('stop')).setEmoji('⏹').setStyle(ButtonStyle.Danger),
    new ButtonBuilder().setCustomId(cid('skip')).setEmoji('⏭').setStyle(ButtonStyle.Secondary),
    new ButtonBuilder().setCustomId(cid('shuffle')).setEmoji('🔀').setStyle(ButtonStyle.Secondary),
  );

  const row2 = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId(cid('loop')).setEmoji('🔁').setStyle(ButtonStyle.Secondary),
    new ButtonBuilder().setCustomId(cid('voldown')).setEmoji('🔉').setStyle(ButtonStyle.Secondary),
    new ButtonBuilder().setCustomId(cid('volup')).setEmoji('🔊').setStyle(ButtonStyle.Secondary),
    new ButtonBuilder().setCustomId(cid('autoplay')).setEmoji('♾️').setStyle(ButtonStyle.Secondary),
    new ButtonBuilder().setCustomId(cid('lyrics')).setEmoji('📜').setStyle(ButtonStyle.Secondary),
  );

  const row3 = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId(cid('clear')).setEmoji('🗑️').setStyle(ButtonStyle.Danger),
  );

  return [row1, row2, row3];
}

async function sendOrUpdatePanel(bot, guildId, textChannel) {
  const queue = bot.lavalink.getQueue(guildId);
  const player = bot.lavalink.shoukaku?.players?.get(guildId);
  const paused = player?.paused || false;

  const nowPlayingEmbed = buildNowPlayingEmbed(bot, guildId);
  const queueEmbed = buildQueueEmbed(bot, guildId);
  const rows = buildControlRows(guildId, paused);

  if (queue.panelMessageId && queue.panelChannelId) {
    try {
      const channel = bot.channels.cache.get(queue.panelChannelId);
      if (channel) {
        const msg = await channel.messages.fetch(queue.panelMessageId).catch(() => null);
        if (msg) {
          await msg.edit({ embeds: [nowPlayingEmbed], components: rows });
        }
      }
    } catch {
      // panel message gone — reset IDs so we re-send below
      queue.panelMessageId = null;
      queue.panelChannelId = null;
    }
  }

  if (queue.queueMessageId && queue.panelChannelId) {
    try {
      const channel = bot.channels.cache.get(queue.panelChannelId);
      if (channel) {
        const msg2 = await channel.messages.fetch(queue.queueMessageId).catch(() => null);
        if (msg2) {
          await msg2.edit({ embeds: [queueEmbed], components: [] });
        } else {
          queue.queueMessageId = null;
        }
      }
    } catch {
      queue.queueMessageId = null;
    }
  }

  if (textChannel && !queue.panelMessageId) {
    try {
      const msg = await textChannel.send({ embeds: [nowPlayingEmbed], components: rows });
      queue.panelMessageId = msg.id;
      queue.panelChannelId = msg.channel.id;

      const msg2 = await textChannel.send({ embeds: [queueEmbed], components: [] });
      queue.queueMessageId = msg2.id;
    } catch {}
  }

  if (queue.current) {
    startLiveUpdater(bot, guildId);
  } else {
    stopLiveUpdater(bot, guildId);
  }
}

function startLiveUpdater(bot, guildId) {
  const queue = bot.lavalink.getQueue(guildId);
  if (queue._liveInterval) return;

  queue._liveInterval = setInterval(() => {
    const q = bot.lavalink.getQueue(guildId);
    const player = bot.lavalink.shoukaku?.players?.get(guildId);
    if (!q.current || !player) {
      stopLiveUpdater(bot, guildId);
      return;
    }
    sendOrUpdatePanel(bot, guildId);
  }, 5000);
}

function stopLiveUpdater(bot, guildId) {
  const queue = bot.lavalink.getQueue(guildId);
  if (queue._liveInterval) {
    clearInterval(queue._liveInterval);
    queue._liveInterval = null;
  }
}

async function handleMusicPanelButton(bot, interaction) {
  const parts = interaction.customId.split('_');
  const guildId = parts[2];
  const action = parts[3];

  if (interaction.guild.id !== guildId) {
    await interaction.reply({ content: 'This panel is not for this server.', ephemeral: true });
    return;
  }

  await interaction.deferUpdate();

  try {
    const player = bot.lavalink.shoukaku?.players?.get(guildId);
    const queue = bot.lavalink.getQueue(guildId);

    switch (action) {
      case 'playpause':
        if (!player) break;
        if (player.paused) await bot.lavalink.resume(guildId);
        else await bot.lavalink.pause(guildId);
        break;

      case 'stop':
        await bot.lavalink.stop(guildId);
        await bot.lavalink.leaveVoiceChannel(guildId);
        break;

      case 'skip':
        await bot.lavalink.skip(guildId);
        break;

      case 'prev':
        await bot.lavalink.previous(guildId);
        break;

      case 'shuffle': {
        const status = bot.lavalink.getStatus(guildId);
        bot.lavalink.setShuffle(guildId, !status.shuffled);
        break;
      }

      case 'loop': {
        const cycle = { 'off': 'track', 'track': 'queue', 'queue': 'autoplay', 'autoplay': 'off' };
        const current = queue.loop === 'autoplay' ? 'autoplay' : queue.loop;
        const next = cycle[current] || 'off';
        if (next === 'autoplay') {
          bot.lavalink.setAutoplay(guildId, true);
          bot.lavalink.setLoop(guildId, 'autoplay');
        } else {
          bot.lavalink.setAutoplay(guildId, false);
          bot.lavalink.setLoop(guildId, next);
        }
        break;
      }

      case 'autoplay': {
        const toggle = !queue.autoplay;
        bot.lavalink.setAutoplay(guildId, toggle);
        if (toggle) bot.lavalink.setLoop(guildId, 'autoplay');
        else if (queue.loop === 'autoplay') bot.lavalink.setLoop(guildId, 'off');
        break;
      }

      case 'volup':
        await bot.lavalink.setVolume(guildId, Math.min((queue.volume || 50) + 10, 150));
        break;

      case 'voldown':
        await bot.lavalink.setVolume(guildId, Math.max((queue.volume || 50) - 10, 10));
        break;

      case 'lyrics': {
        const status = bot.lavalink.getStatus(guildId);
        if (!status.current) {
          await interaction.editReply({ content: 'Nothing is playing.' });
          return setTimeout(() => sendOrUpdatePanel(bot, guildId), 1000);
        }

        const guildCfg = await bot.guildConfig(guildId);
        const lyricsEnabled = guildCfg.music_lyrics_enabled !== undefined ? guildCfg.music_lyrics_enabled : bot.config.music.lyrics.enabled;
        if (!lyricsEnabled) {
          await interaction.editReply({ content: 'Lyrics are disabled for this server.' });
          return setTimeout(() => sendOrUpdatePanel(bot, guildId), 5000);
        }

        await interaction.editReply({ content: 'Fetching lyrics...' });
        try {
          const a = status.current.info.author.replace(/ \(.*?\)|\[.*?\]/g, '').trim();
          const t = status.current.info.title.replace(/ \(.*?\)|\[.*?\]/g, '').trim();
          if (a && t) {
            const res = await axios.get(`https://api.lyrics.ovh/v1/${encodeURIComponent(a)}/${encodeURIComponent(t)}`);
            if (res.data?.lyrics) {
              const embed = new EmbedBuilder()
                .setColor(0x00E5FF)
                .setTitle(`Lyrics - ${status.current.info.title}`)
                .setDescription(res.data.lyrics.length > 4096 ? res.data.lyrics.substring(0, 4093) + '...' : res.data.lyrics);
              await interaction.editReply({ content: null, embeds: [embed] });
              return setTimeout(() => sendOrUpdatePanel(bot, guildId), 120000);
            }
          }
          await interaction.editReply({ content: 'No lyrics found.' });
        } catch {
          await interaction.editReply({ content: 'No lyrics found.' });
        }
        return setTimeout(() => sendOrUpdatePanel(bot, guildId), 5000);
      }

      case 'clear':
        bot.lavalink.clearQueue(guildId);
        break;

      default:
        break;
    }

    await sendOrUpdatePanel(bot, guildId);
  } catch (err) {
    console.error(`[MusicPanel] Error handling ${action}:`, err.message);
    await sendOrUpdatePanel(bot, guildId);
  }
}

module.exports = {
  sendOrUpdatePanel,
  handleMusicPanelButton,
  buildNowPlayingEmbed,
  buildQueueEmbed,
  stopLiveUpdater
};
