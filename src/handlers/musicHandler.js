module.exports = function setupMusicHandler(bot) {
  if (!bot.lavalink || !bot.lavalink.shoukaku) return;

  bot.lavalink.shoukaku.on('playerEvent', async (name, player, event) => {
    if (event.type === 'TrackEndEvent') {
      if (event.reason === 'REPLACED') return;

      const queue = bot.lavalink.getQueue(player.guildId);

      if (event.reason === 'STOPPED') {
        queue.current = null;
        return;
      }

      if (queue.loop === 'track' && queue.current) {
        await player.playTrack({ track: queue.current.encoded });
        return;
      }

      if (queue.history.length >= 50) queue.history.shift();
      if (queue.current) queue.history.push(queue.current);

      if (queue.loop === 'queue' && queue.current) {
        queue.tracks.push(queue.current);
      }

      if (queue.tracks.length > 0) {
        queue.current = queue.tracks.shift();
        await player.playTrack({ track: queue.current.encoded });
      } else if (queue.autoplay) {
        try {
          const current = queue.history[queue.history.length - 1];
          if (current && current.info?.identifier) {
            const result = await bot.lavalink.shoukaku.getNode().rest.resolve(`ytsearch:${current.info.title} ${current.info.author} mix`);
            if (result && result.tracks.length > 1) {
              const next = result.tracks[1];
              queue.current = next;
              await player.playTrack({ track: next.encoded });
            }
          }
        } catch {
          queue.current = null;
        }
      } else {
        queue.current = null;
      }
    }

    if (event.type === 'TrackExceptionEvent') {
      console.error(`[Lavalink] Track exception in ${player.guildId}:`, event.exception?.message);
      const queue = bot.lavalink.getQueue(player.guildId);
      if (queue.tracks.length > 0) {
        queue.current = queue.tracks.shift();
        await player.playTrack({ track: queue.current.encoded });
      }
    }

    if (event.type === 'TrackStuckEvent') {
      console.warn(`[Lavalink] Track stuck in ${player.guildId}, skipping...`);
      const queue = bot.lavalink.getQueue(player.guildId);
      if (queue.tracks.length > 0) {
        queue.current = queue.tracks.shift();
        await player.playTrack({ track: queue.current.encoded });
      }
    }

    if (event.type === 'WebSocketClosedEvent') {
      if (event.code === 4014) {
        bot.lavalink.queues.delete(player.guildId);
      }
    }
  });
};
