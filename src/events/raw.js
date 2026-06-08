module.exports = {
  name: 'raw',
  execute(bot, data) {
    if (!bot.lavalink || !bot.lavalink.initialized) return;
    if (data.t === 'VOICE_SERVER_UPDATE' || data.t === 'VOICE_STATE_UPDATE') {
      bot.lavalink.shoukaku.handleVoiceUpdate(data);
    }
  }
};
