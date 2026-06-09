const globalConfig = require('../../config');
const { getConfig } = require('../database/guildConfig');

const cache = new Map();
let cacheTimer = null;

function startCacheCleanup() {
  if (cacheTimer) return;
  cacheTimer = setInterval(() => {
    cache.clear();
  }, 60000);
}

startCacheCleanup();

function resolveKey(guildConfig, key, defaultValue) {
  const stored = guildConfig[key];
  if (stored !== undefined && stored !== null && stored !== '') return stored;
  return defaultValue;
}

async function getModuleConfig(guildId, moduleName) {
  const cacheKey = `${guildId}_${moduleName}`;
  if (cache.has(cacheKey)) return cache.get(cacheKey);

  let guildConfig = {};
  try {
    guildConfig = await getConfig(guildId);
  } catch {}

  const defaults = globalConfig[moduleName] || {};
  const merged = { ...defaults };

  const prefix = `${moduleName}_`;
  for (const [key, val] of Object.entries(guildConfig)) {
    if (key.startsWith(prefix)) {
      const configKey = key.slice(prefix.length);
      merged[configKey] = val;
    }
  }

  cache.set(cacheKey, merged);
  return merged;
}

module.exports = { getModuleConfig, resolveKey };
