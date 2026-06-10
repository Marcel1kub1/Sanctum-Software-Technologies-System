module.exports = function setupMusicHandler(bot) {
  if (!bot.lavalink || !bot.lavalink.shoukaku) return;

  const { sendOrUpdatePanel, stopLiveUpdater } = require('./musicPanelHandler');

  function normalizeLavalinkResult(result) {
    if (!result) return null;
    if (result.tracks) return result;
    if (!result.loadType) return result;
    if (result.loadType === 'empty' || result.loadType === 'error') return { tracks: [] };
    if (result.loadType === 'track') return { tracks: [result.data] };
    if (result.loadType === 'playlist') return { tracks: result.data.tracks, playlistInfo: result.data.info };
    if (result.loadType === 'search') return { tracks: result.data };
    return result;
  }

  function playNext(player, guildId) {
    const queue = bot.lavalink.getQueue(guildId);
    if (queue.tracks.length > 0) {
      queue.current = queue.tracks.shift();
      player.playTrack({ track: { encoded: queue.current.encoded } });
      sendOrUpdatePanel(bot, guildId);
    } else if (queue.autoplay) {
      try {
        const current = queue.history[queue.history.length - 1];
        if (current && current.info?.identifier) {
          const node = bot.lavalink.shoukaku.getIdealNode();
          if (!node) return;
          node.rest.resolve(`ytsearch:${current.info.title} ${current.info.author} mix`).then(res => {
            const result = normalizeLavalinkResult(res);
            if (result && result.tracks && result.tracks.length > 1) {
              const next = result.tracks[1];
              queue.current = next;
              player.playTrack({ track: { encoded: next.encoded } });
              sendOrUpdatePanel(bot, guildId);
            }
          }).catch(() => {});
        }
      } catch {}
    } else {
      queue.current = null;
      player.stopTrack();
      stopLiveUpdater(bot, guildId);
      sendOrUpdatePanel(bot, guildId);
    }
  }

  bot.lavalink.shoukaku.on('raw', (name, json) => {
    if (json.op !== 'event') return;

    const player = bot.lavalink.shoukaku.players.get(json.guildId);
    if (!player) return;

    if (json.type === 'TrackEndEvent') {
      if (json.reason === 'REPLACED') return;

      const guildId = player.guildId;
      const queue = bot.lavalink.getQueue(guildId);

      if (json.reason === 'STOPPED') {
        queue.current = null;
        stopLiveUpdater(bot, guildId);
        sendOrUpdatePanel(bot, guildId);
        return;
      }

      if (queue.loop === 'track' && queue.current) {
        player.playTrack({ track: { encoded: queue.current.encoded } });
        sendOrUpdatePanel(bot, guildId);
        return;
      }

      if (queue.history.length >= 50) queue.history.shift();
      if (queue.current) queue.history.push(queue.current);

      if (queue.loop === 'queue' && queue.current) {
        queue.tracks.push(queue.current);
      }

      playNext(player, guildId);
    }

    if (json.type === 'TrackExceptionEvent') {
      console.error(`[Lavalink] Track exception in ${player.guildId}:`, json.exception?.message);
      const guildId = player.guildId;
      const queue = bot.lavalink.getQueue(guildId);
      if (queue.tracks.length > 0) {
        playNext(player, guildId);
      }
      sendOrUpdatePanel(bot, guildId);
    }

    if (json.type === 'TrackStuckEvent') {
      console.warn(`[Lavalink] Track stuck in ${player.guildId}, skipping...`);
      const guildId = player.guildId;
      const queue = bot.lavalink.getQueue(guildId);
      if (queue.tracks.length > 0) {
        playNext(player, guildId);
      }
      sendOrUpdatePanel(bot, guildId);
    }

    if (json.type === 'TrackStartEvent') {
      sendOrUpdatePanel(bot, player.guildId);
    }

    if (json.type === 'WebSocketClosedEvent') {
      if (json.code === 4014) {
        const guildId = player.guildId;
        stopLiveUpdater(bot, guildId);
        bot.lavalink.queues.delete(guildId);
      }
    }
  });
};
