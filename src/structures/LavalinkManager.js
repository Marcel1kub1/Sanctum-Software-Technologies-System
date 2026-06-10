const { Connectors } = require('shoukaku');
const { isProhibited } = require('../utils/prohibitedSongs');
const { getConfig } = require('../database/guildConfig');

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

class LavalinkManager {
  constructor(bot) {
    this.bot = bot;
    this.nodes = [];
    this.queues = new Map();
    this.shoukaku = null;
    this.initialized = false;
  }

  init() {
    if (this.initialized) return;
    const Shoukaku = require('shoukaku');
    const config = this.bot.config.music.lavalink;

    this.shoukaku = new Shoukaku.Shoukaku(new Connectors.DiscordJS(this.bot), [{
      name: 'Main Node',
      url: config.host + ':' + config.port,
      auth: config.password,
      secure: config.ssl
    }], {
      moveOnDisconnect: config.autoResume,
      resumable: config.autoResume,
      resumableTimeout: 30,
      reconnectTries: 5,
      reconnectInterval: 5000
    });

    this.shoukaku.on('ready', (name) => console.log(`[Lavalink] Node ${name} connected`));
    this.shoukaku.on('error', (name, error) => console.error(`[Lavalink] Node ${name} error:`, error.message));
    this.shoukaku.on('close', (name, code, reason) => console.log(`[Lavalink] Node ${name} closed (${code}): ${reason}`));
    this.shoukaku.on('disconnect', (name, reason) => console.log(`[Lavalink] Node ${name} disconnected:`, reason));

    this.initialized = true;
  }

  getNode() {
    if (!this.shoukaku) return null;
    const node = this.shoukaku.getIdealNode();
    if (!node) return null;
    return node;
  }

  async getPlayer(guildId) {
    return this.shoukaku?.players?.get(guildId) ?? null;
  }

  async joinVoiceChannel(guildId, channelId, deaf = true) {
    const node = this.getNode();
    if (!node) throw new Error('No Lavalink node available');

    const existingConnection = this.shoukaku?.connections?.get(guildId);
    if (existingConnection?.channelId === channelId) {
      const p = this.shoukaku?.players?.get(guildId);
      if (p) return p;
    }

    await this.shoukaku?.leaveVoiceChannel(guildId);

    const player = await this.shoukaku.joinVoiceChannel({
      guildId,
      channelId,
      deaf,
      shardId: 0
    });
    return player;
  }

  async leaveVoiceChannel(guildId) {
    await this.shoukaku?.leaveVoiceChannel(guildId);
    this.queues.delete(guildId);
  }

  getQueue(guildId) {
    if (!this.queues.has(guildId)) {
      this.queues.set(guildId, { tracks: [], history: [], current: null, loop: 'off', shuffled: false, autoplay: false, volume: 50, panelMessageId: null, panelChannelId: null, queueMessageId: null, _liveInterval: null });
    }
    return this.queues.get(guildId);
  }

  async play(guildId, query, requester) {
    const node = this.getNode();
    if (!node) throw new Error('No Lavalink node available');
    const player = await this.getPlayer(guildId);
    if (!player) throw new Error('No player for this guild');

    let result = await node.rest.resolve(query);
    result = normalizeLavalinkResult(result);
    if (!result || !result.tracks || !result.tracks.length) throw new Error('No results found');

    const queue = this.getQueue(guildId);
    const tracks = result.tracks.map(t => { t.requester = requester; return t; });

    const guildConfig = await getConfig(guildId);
    const filterEnabled = guildConfig.prohibited_enabled === true;
    let blocked = 0;
    let allowed;
    if (filterEnabled) {
      allowed = [];
      for (const track of tracks) {
        if (!(await isProhibited(guildId, track))) {
          allowed.push(track);
        }
      }
      blocked = tracks.length - allowed.length;
    } else {
      allowed = tracks;
    }

    if (allowed.length === 0) throw new Error(
      blocked === 1 ? 'That song is prohibited and cannot be played.' : 'All songs in that request are prohibited.'
    );

    if (result.playlistInfo) {
      const total = tracks.length;
      if (queue.current) {
        queue.tracks.push(...allowed);
        return { playlist: true, playlistName: result.playlistInfo.name, count: total, queued: true, position: queue.tracks.length - allowed.length + 1, blocked };
      }
      const first = allowed.shift();
      queue.current = first;
      queue.tracks.push(...allowed);
      await player.playTrack({ track: { encoded: first.encoded } });
      return { playlist: true, playlistName: result.playlistInfo.name, count: total, queued: false, blocked };
    }

    const track = allowed[0];
    if (queue.current) {
      queue.tracks.push(track);
      return { track, queued: true, position: queue.tracks.length };
    }

    queue.current = track;
    await player.playTrack({ track: { encoded: track.encoded } });
    return { track, queued: false };
  }

  async skip(guildId) {
    const player = await this.getPlayer(guildId);
    if (!player) throw new Error('No active player');
    const queue = this.getQueue(guildId);

    if (queue.tracks.length === 0) {
      if (queue.history.length >= 50) queue.history.shift();
      if (queue.current) queue.history.push(queue.current);
      queue.current = null;
      await player.stopTrack();
      return null;
    }

    const next = queue.tracks.shift();

    await player.playTrack({ track: { encoded: next.encoded } });

    if (queue.history.length >= 50) queue.history.shift();
    if (queue.current) queue.history.push(queue.current);
    queue.current = next;

    return queue.current;
  }

  async stop(guildId) {
    const player = await this.getPlayer(guildId);
    if (!player) return;
    const queue = this.getQueue(guildId);
    queue.tracks = [];
    queue.current = null;
    await player.stopTrack();
  }

  async pause(guildId) {
    const player = await this.getPlayer(guildId);
    if (!player) throw new Error('No active player');
    await player.setPaused();
  }

  async resume(guildId) {
    const player = await this.getPlayer(guildId);
    if (!player) throw new Error('No active player');
    await player.setPaused(false);
  }

  async setVolume(guildId, volume) {
    const player = await this.getPlayer(guildId);
    if (!player) throw new Error('No active player');
    const vol = Math.max(10, Math.min(150, volume));
    await player.setGlobalVolume(vol);
    const queue = this.getQueue(guildId);
    queue.volume = vol;
  }

  async seek(guildId, position) {
    const player = await this.getPlayer(guildId);
    if (!player) throw new Error('No active player');
    await player.seekTo(position);
  }

  setLoop(guildId, mode) {
    const queue = this.getQueue(guildId);
    queue.loop = mode;
  }

  setShuffle(guildId, enabled) {
    const queue = this.getQueue(guildId);
    queue.shuffled = enabled;
    if (enabled) {
      for (let i = queue.tracks.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [queue.tracks[i], queue.tracks[j]] = [queue.tracks[j], queue.tracks[i]];
      }
    }
  }

  setAutoplay(guildId, enabled) {
    const queue = this.getQueue(guildId);
    queue.autoplay = enabled;
  }

  removeTrack(guildId, index) {
    const queue = this.getQueue(guildId);
    if (index < 0 || index >= queue.tracks.length) return false;
    queue.tracks.splice(index, 1);
    return true;
  }

  clearQueue(guildId) {
    const queue = this.getQueue(guildId);
    queue.tracks = [];
  }

  async previous(guildId) {
    const queue = this.getQueue(guildId);
    if (queue.history.length === 0) return null;
    const prev = queue.history.pop();
    if (queue.current) queue.tracks.unshift(queue.current);
    queue.current = prev;

    const player = await this.getPlayer(guildId);
    if (player) await player.playTrack({ track: { encoded: prev.encoded } });
    return prev;
  }

  getStatus(guildId) {
    const queue = this.getQueue(guildId);
    return {
      current: queue.current,
      queueLength: queue.tracks.length,
      historyLength: queue.history.length,
      loop: queue.loop,
      shuffled: queue.shuffled,
      autoplay: queue.autoplay,
      volume: queue.volume
    };
  }
}

module.exports = LavalinkManager;
