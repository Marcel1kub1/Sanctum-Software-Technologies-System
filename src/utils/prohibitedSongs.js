const { getConfig, updateConfig } = require('../database/guildConfig');

function getPatterns(config) {
  const raw = config.prohibited_patterns;
  if (Array.isArray(raw)) return raw;
  if (typeof raw === 'string' && raw.trim()) return raw.split('\n').map(s => s.trim()).filter(Boolean);
  return [];
}

async function isProhibited(guildId, track) {
  if (!track || !track.info) return false;
  const config = await getConfig(guildId);
  const patterns = getPatterns(config);
  if (patterns.length === 0) return false;
  const lower = patterns.map(p => p.toLowerCase());
  const title = (track.info.title || '').toLowerCase();
  const author = (track.info.author || '').toLowerCase();
  return lower.some(p => title.includes(p) || author.includes(p));
}

async function list(guildId) {
  const config = await getConfig(guildId);
  return getPatterns(config);
}

async function add(guildId, pattern) {
  const config = await getConfig(guildId);
  const patterns = getPatterns(config);
  if (patterns.some(p => p.toLowerCase() === pattern.toLowerCase())) return false;
  patterns.push(pattern);
  await updateConfig(guildId, { prohibited_patterns: patterns });
  return true;
}

async function remove(guildId, pattern) {
  const config = await getConfig(guildId);
  const patterns = getPatterns(config);
  const idx = patterns.findIndex(p => p.toLowerCase() === pattern.toLowerCase());
  if (idx === -1) return false;
  patterns.splice(idx, 1);
  await updateConfig(guildId, { prohibited_patterns: patterns });
  return true;
}

module.exports = { isProhibited, list, add, remove };
