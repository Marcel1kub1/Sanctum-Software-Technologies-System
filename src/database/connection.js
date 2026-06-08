const mysql = require('mysql2/promise');
const config = require('../../config');

let pool;

async function createPool() {
  try {
    pool = mysql.createPool({
      host: config.database.host,
      port: config.database.port,
      user: config.database.user,
      password: config.database.password,
      database: config.database.database,
      waitForConnections: config.database.waitForConnections,
      connectionLimit: config.database.connectionLimit,
      queueLimit: config.database.queueLimit
    });

    const conn = await pool.getConnection();
    console.log('[DB] Connected to MySQL successfully.');
    conn.release();
    return pool;
  } catch (err) {
    console.error('[DB] Failed to connect to MySQL:', err.message);
    process.exit(1);
  }
}

function getPool() {
  if (!pool) {
    throw new Error('Database pool not initialized. Call createPool() first.');
  }
  return pool;
}

async function query(sql, params) {
  const conn = getPool();
  const [rows] = await conn.execute(sql, params);
  return rows;
}

async function getGuild(guildId) {
  const rows = await query('SELECT * FROM guilds WHERE guild_id = ?', [guildId]);
  if (rows.length === 0) {
    await query('INSERT INTO guilds (guild_id) VALUES (?)', [guildId]);
    return { guild_id: guildId, prefix: null, mod_log_channel: null, welcome_channel: null, goodbye_channel: null, ticket_category: null, mute_role: null };
  }
  return rows[0];
}

async function getUser(userId) {
  const rows = await query('SELECT * FROM users WHERE user_id = ?', [userId]);
  if (rows.length === 0) {
    await query('INSERT INTO users (user_id) VALUES (?)', [userId]);
    return { user_id: userId, balance: 500, xp: 0, level: 0, daily_last: null, created_at: null };
  }
  return rows[0];
}

async function getGiveaway(messageId) {
  const rows = await query('SELECT * FROM giveaways WHERE message_id = ?', [messageId]);
  return rows.length > 0 ? rows[0] : null;
}

module.exports = { createPool, getPool, query, getGuild, getUser, getGiveaway };
