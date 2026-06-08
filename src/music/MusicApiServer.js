const express = require('express');
const config = require('../../config');

class MusicApiServer {
  constructor(bot) {
    this.bot = bot;
    this.app = express();
    this.server = null;
  }

  start() {
    const apiConfig = config.music.localApi;
    if (!apiConfig.enabled) return;

    this.app.use(express.json());

    const authMiddleware = (req, res, next) => {
      if (apiConfig.apiKey && req.headers['x-api-key'] !== apiConfig.apiKey) {
        return res.status(401).json({ error: 'Unauthorized' });
      }
      next();
    };

    this.app.get('/health', authMiddleware, (req, res) => {
      const node = this.bot.lavalink ? this.bot.lavalink.getNode() : null;
      res.json({
        status: node ? 'connected' : 'disconnected',
        guilds: this.bot.guilds.cache.size,
        players: node ? node.stats?.players || 0 : 0,
        uptime: process.uptime()
      });
    });

    this.app.get('/queue', authMiddleware, (req, res) => {
      const guildId = req.query.guild;
      if (!guildId) return res.status(400).json({ error: 'Missing guild parameter' });

      const status = this.bot.lavalink.getStatus(guildId);
      const queue = this.bot.lavalink.getQueue(guildId);
      const player = this.bot.lavalink.shoukaku?.getNode()?.getPlayer(guildId);

      res.json({
        current: status.current ? {
          title: status.current.info.title,
          author: status.current.info.author,
          duration: status.current.info.length,
          uri: status.current.info.uri,
          requester: status.current.requester
        } : null,
        tracks: queue.tracks.map((t, i) => ({
          position: i + 1,
          title: t.info.title,
          author: t.info.author,
          duration: t.info.length
        })),
        history: queue.history.slice(-10).map(t => t.info.title),
        settings: {
          loop: status.loop,
          shuffled: status.shuffled,
          autoplay: status.autoplay,
          volume: status.volume
        },
        player: player ? {
          playing: player.playing,
          paused: player.paused,
          position: player.position,
          ping: player.ping
        } : null
      });
    });

    this.app.post('/play', authMiddleware, async (req, res) => {
      const { guild, query, channel } = req.body;
      if (!guild || !query) return res.status(400).json({ error: 'Missing guild or query' });

      try {
        const g = this.bot.guilds.cache.get(guild);
        if (!g) return res.status(404).json({ error: 'Guild not found' });

        const voiceChannel = channel || g.members.me.voice.channelId;
        if (!voiceChannel) return res.status(400).json({ error: 'Bot not in a voice channel and no channel provided' });

        let player = await this.bot.lavalink.getPlayer(guild);
        if (!player) {
          await this.bot.lavalink.joinVoiceChannel(guild, voiceChannel);
        }

        const result = await this.bot.lavalink.play(guild, query, 'API');
        res.json({ success: true, track: result.track.info.title, queued: result.queued });
      } catch (err) {
        res.status(500).json({ error: err.message });
      }
    });

    const port = apiConfig.port || 7788;
    this.server = this.app.listen(port, '127.0.0.1', () => {
      console.log(`[MusicAPI] Running on port ${port}`);
    });
  }

  stop() {
    if (this.server) this.server.close();
  }
}

module.exports = MusicApiServer;
