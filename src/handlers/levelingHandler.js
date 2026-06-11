const db = require('../database/connection');

const messageCooldowns = new Map();
const voiceStartTimes = new Map();
const voiceAccumulated = new Map();

function getGuildConfigValue(guildConfig, key, defaultValue = undefined) {
  if (guildConfig && guildConfig.config && guildConfig.config[key] !== undefined) {
    return guildConfig.config[key];
  }
  return defaultValue;
}

async function addMessageXP(bot, message, guildConfig) {
  if (!getGuildConfigValue(guildConfig, 'leveling_enabled', true)) return;
  if (message.author.bot) return;

  const guildId = message.guild.id;
  const userId = message.author.id;

  const blacklist = getGuildConfigValue(guildConfig, 'leveling_channel_blacklist', '');
  if (blacklist) {
    const channels = blacklist.split(',').map(c => c.trim());
    if (channels.includes(message.channel.id)) return;
  }

  const cooldownKey = `${guildId}:${userId}`;
  const cooldownMs = getGuildConfigValue(guildConfig, 'leveling_xp_cooldown', 60000);
  const now = Date.now();
  const lastTime = messageCooldowns.get(cooldownKey) || 0;
  if (now - lastTime < cooldownMs) return;
  messageCooldowns.set(cooldownKey, now);

  const perMessage = getGuildConfigValue(guildConfig, 'leveling_xp_per_message', 15);
  const multiplier = getGuildConfigValue(guildConfig, 'leveling_xp_multiplier', 1.5);
  const baseXp = getGuildConfigValue(guildConfig, 'leveling_base_xp', 100);
  const xpGain = Math.floor(Math.random() * (perMessage * multiplier)) + 1;

  const rows = await db.query(
    'SELECT total_xp FROM leveling_xp WHERE guild_id = ? AND user_id = ?',
    [guildId, userId]
  );
  const oldTotal = rows.length > 0 ? rows[0].total_xp : 0;
  const oldLevel = Math.floor(Math.sqrt(oldTotal / baseXp)) + 1;

  await db.query(
    `INSERT INTO leveling_xp (guild_id, user_id, xp, voice_xp, total_xp, last_message_time)
     VALUES (?, ?, ?, 0, ?, ?)
     ON DUPLICATE KEY UPDATE xp = xp + VALUES(xp), total_xp = total_xp + VALUES(xp), last_message_time = VALUES(last_message_time)`,
    [guildId, userId, xpGain, oldTotal + xpGain, now]
  );

  const newTotal = oldTotal + xpGain;
  const newLevel = Math.floor(Math.sqrt(newTotal / baseXp)) + 1;

  if (newLevel > oldLevel) {
    return {
      leveledUp: true,
      oldLevel,
      newLevel,
      xp: newTotal,
      xpForNext: Math.pow(newLevel, 2) * baseXp
    };
  }
}

async function addVoiceXP(bot, oldState, newState, guildConfig) {
  if (!getGuildConfigValue(guildConfig, 'leveling_voice_xp_enabled', true)) return;
  if (!getGuildConfigValue(guildConfig, 'leveling_enabled', true)) return;

  const guildId = (oldState.guild || newState.guild).id;
  const userId = oldState.member?.id || newState.member?.id;
  if (!userId) return;

  const voiceKey = `${guildId}:${userId}`;

  if (oldState.channelId === null && newState.channelId !== null) {
    voiceStartTimes.set(voiceKey, Date.now());
    if (!voiceAccumulated.has(voiceKey)) {
      voiceAccumulated.set(voiceKey, 0);
    }
    return;
  }

  const startTime = voiceStartTimes.get(voiceKey);
  if (!startTime) return;

  const elapsed = Date.now() - startTime;
  const accumulated = (voiceAccumulated.get(voiceKey) || 0) + elapsed;

  if (newState.channelId !== null) {
    voiceStartTimes.set(voiceKey, Date.now());
  } else {
    voiceStartTimes.delete(voiceKey);
  }

  const xpPerMinute = getGuildConfigValue(guildConfig, 'leveling_xp_per_voice_minute', 10);
  const secondsThreshold = 60;
  const totalMs = accumulated;
  const xpCycles = Math.floor(totalMs / (secondsThreshold * 1000));

  if (xpCycles > 0) {
    const remainingMs = totalMs % (secondsThreshold * 1000);
    const xpGain = xpCycles * xpPerMinute;

    const rows = await db.query(
      'SELECT total_xp FROM leveling_xp WHERE guild_id = ? AND user_id = ?',
      [guildId, userId]
    );
    const oldTotal = rows.length > 0 ? rows[0].total_xp : 0;

    await db.query(
      `INSERT INTO leveling_xp (guild_id, user_id, xp, voice_xp, total_xp, last_message_time)
       VALUES (?, ?, 0, ?, ?, 0)
       ON DUPLICATE KEY UPDATE voice_xp = voice_xp + VALUES(voice_xp), total_xp = total_xp + VALUES(voice_xp)`,
      [guildId, userId, xpGain, oldTotal + xpGain]
    );

    voiceAccumulated.set(voiceKey, remainingMs);
  } else {
    voiceAccumulated.set(voiceKey, totalMs);
  }

  if (newState.channelId === null) {
    voiceAccumulated.delete(voiceKey);
  }
}

async function checkLevelUp(guildId, userId, newXp, guildConfig) {
  const baseXp = getGuildConfigValue(guildConfig, 'leveling_base_xp', 100);
  const rows = await db.query(
    'SELECT total_xp FROM leveling_xp WHERE guild_id = ? AND user_id = ?',
    [guildId, userId]
  );

  const totalXp = rows.length > 0 ? rows[0].total_xp : newXp;
  const oldXp = totalXp - 1;
  const oldLevel = Math.floor(Math.sqrt(Math.max(oldXp, 0) / baseXp)) + 1;
  const newLevel = Math.floor(Math.sqrt(newXp / baseXp)) + 1;
  const xpForNext = Math.pow(newLevel, 2) * baseXp;

  return {
    leveledUp: newLevel > oldLevel,
    oldLevel,
    newLevel,
    xp: newXp,
    xpForNext
  };
}

async function getLevelInfo(guildId, userId) {
  let rows = await db.query(
    'SELECT xp, voice_xp, total_xp FROM leveling_xp WHERE guild_id = ? AND user_id = ?',
    [guildId, userId]
  );

  if (rows.length === 0) {
    await db.query(
      'INSERT INTO leveling_xp (guild_id, user_id, xp, voice_xp, total_xp) VALUES (?, ?, 0, 0, 0)',
      [guildId, userId]
    );
    rows = await db.query(
      'SELECT xp, voice_xp, total_xp FROM leveling_xp WHERE guild_id = ? AND user_id = ?',
      [guildId, userId]
    );
  }

  const totalXp = rows[0] ? rows[0].total_xp : 0;
  const level = Math.floor(Math.sqrt(totalXp / 100)) + 1;
  const xpForNext = Math.pow(level, 2) * 100;
  const currentLevelXp = Math.pow(level - 1, 2) * 100;
  const progress = xpForNext - currentLevelXp > 0
    ? (totalXp - currentLevelXp) / (xpForNext - currentLevelXp)
    : 0;

  return {
    xp: rows[0] ? rows[0].xp : 0,
    voice_xp: rows[0] ? rows[0].voice_xp : 0,
    total_xp: totalXp,
    level,
    xpForNext,
    progress: Math.min(progress, 1)
  };
}

async function getLeaderboard(guildId, limit = 10) {
  const rows = await db.query(
    'SELECT user_id, total_xp FROM leveling_xp WHERE guild_id = ? ORDER BY total_xp DESC LIMIT ?',
    [guildId, limit]
  );

  return rows.map(row => ({
    user_id: row.user_id,
    xp: row.total_xp,
    level: Math.floor(Math.sqrt(row.total_xp / 100)) + 1
  }));
}

module.exports = { addMessageXP, addVoiceXP, checkLevelUp, getLevelInfo, getLeaderboard };
