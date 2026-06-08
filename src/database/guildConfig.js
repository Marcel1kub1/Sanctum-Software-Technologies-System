const { query } = require('./connection');

const DEFAULTS = {
  prefix: '!',
  timezone: 'UTC',
  language: 'en',
  dateFormat: 'MM/DD/YYYY',
  silentMode: false,
  deleteCommandMessages: false,
  commandCooldowns: true,
  dmErrorMessages: false,
  autoDeleteBotMessages: false,
  autoDeleteDelay: 30
};

async function getConfig(guildId) {
  const rows = await query('SELECT config FROM guild_config WHERE guild_id = ?', [guildId]);
  if (rows.length === 0) {
    const defaults = JSON.stringify(DEFAULTS);
    await query('INSERT INTO guild_config (guild_id, config) VALUES (?, ?)', [guildId, defaults]);
    return { ...DEFAULTS };
  }
  return { ...DEFAULTS, ...JSON.parse(rows[0].config) };
}

async function updateConfig(guildId, updates) {
  const existing = await getConfig(guildId);
  const merged = { ...existing, ...updates };
  const json = JSON.stringify(merged);
  await query('INSERT INTO guild_config (guild_id, config) VALUES (?, ?) ON DUPLICATE KEY UPDATE config = ?', [guildId, json, json]);
  return merged;
}

module.exports = { getConfig, updateConfig, DEFAULTS };
