const mysql = require('mysql2/promise');
const config = require('../../config');

const schemas = [
  `CREATE TABLE IF NOT EXISTS guilds (
    id INT AUTO_INCREMENT PRIMARY KEY,
    guild_id VARCHAR(255) NOT NULL UNIQUE,
    prefix VARCHAR(10) DEFAULT NULL,
    mod_log_channel VARCHAR(255) DEFAULT NULL,
    welcome_channel VARCHAR(255) DEFAULT NULL,
    goodbye_channel VARCHAR(255) DEFAULT NULL,
    welcome_message TEXT DEFAULT NULL,
    goodbye_message TEXT DEFAULT NULL,
    ticket_category VARCHAR(255) DEFAULT NULL,
    ticket_panel_channel VARCHAR(255) DEFAULT NULL,
    ticket_support_roles TEXT DEFAULT NULL,
    ticket_log_channel VARCHAR(255) DEFAULT NULL,
    ticket_limit INT DEFAULT 5,
    mute_role VARCHAR(255) DEFAULT NULL,
    auto_mod_level VARCHAR(50) DEFAULT 'off',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_guild_id (guild_id)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

  `CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL UNIQUE,
    balance BIGINT DEFAULT 500,
    xp BIGINT DEFAULT 0,
    level INT DEFAULT 0,
    daily_last TIMESTAMP NULL DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_user_id (user_id)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

  `CREATE TABLE IF NOT EXISTS giveaways (
    id INT AUTO_INCREMENT PRIMARY KEY,
    message_id VARCHAR(255) NOT NULL UNIQUE,
    channel_id VARCHAR(255) NOT NULL,
    guild_id VARCHAR(255) NOT NULL,
    prize TEXT NOT NULL,
    winners INT DEFAULT 1,
    end_time BIGINT NOT NULL,
    requirements JSON DEFAULT NULL,
    entrants JSON DEFAULT NULL,
    ended TINYINT(1) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_message_id (message_id),
    INDEX idx_guild_id (guild_id)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

  `CREATE TABLE IF NOT EXISTS tickets (
    id INT AUTO_INCREMENT PRIMARY KEY,
    ticket_id VARCHAR(255) NOT NULL UNIQUE,
    channel_id VARCHAR(255) NOT NULL,
    guild_id VARCHAR(255) NOT NULL,
    creator_id VARCHAR(255) NOT NULL,
    subject TEXT DEFAULT NULL,
    status VARCHAR(50) DEFAULT 'open',
    claimed_by VARCHAR(255) DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    closed_at TIMESTAMP NULL DEFAULT NULL,
    INDEX idx_ticket_id (ticket_id),
    INDEX idx_guild_id (guild_id)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

  `CREATE TABLE IF NOT EXISTS warnings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL,
    guild_id VARCHAR(255) NOT NULL,
    moderator_id VARCHAR(255) NOT NULL,
    reason TEXT DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_user_guild (user_id, guild_id)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

  `CREATE TABLE IF NOT EXISTS levels (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL,
    guild_id VARCHAR(255) NOT NULL,
    xp BIGINT DEFAULT 0,
    level INT DEFAULT 0,
    last_message TIMESTAMP NULL DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY unique_user_guild (user_id, guild_id),
    INDEX idx_user_guild (user_id, guild_id)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

  `CREATE TABLE IF NOT EXISTS economy (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL,
    guild_id VARCHAR(255) NOT NULL,
    balance BIGINT DEFAULT 500,
    bank BIGINT DEFAULT 0,
    daily_last TIMESTAMP NULL DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY unique_user_guild (user_id, guild_id),
    INDEX idx_user_guild (user_id, guild_id)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

  `CREATE TABLE IF NOT EXISTS warnings_count (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL,
    guild_id VARCHAR(255) NOT NULL,
    count INT DEFAULT 0,
    UNIQUE KEY unique_user_guild (user_id, guild_id),
    INDEX idx_user_guild (user_id, guild_id)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

  `CREATE TABLE IF NOT EXISTS music_queue (
    id INT AUTO_INCREMENT PRIMARY KEY,
    guild_id VARCHAR(255) NOT NULL,
    song_url TEXT NOT NULL,
    song_title TEXT NOT NULL,
    requester_id VARCHAR(255) NOT NULL,
    duration BIGINT DEFAULT 0,
    position INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_guild_position (guild_id, position)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

  `CREATE TABLE IF NOT EXISTS muted_users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL,
    guild_id VARCHAR(255) NOT NULL,
    role_id VARCHAR(255) DEFAULT NULL,
    unmix_at BIGINT DEFAULT NULL,
    reason TEXT DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_user_guild (user_id, guild_id)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

  `CREATE TABLE IF NOT EXISTS guild_config (
    id INT AUTO_INCREMENT PRIMARY KEY,
    guild_id VARCHAR(255) NOT NULL UNIQUE,
    config JSON NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_guild_id (guild_id)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

  `CREATE TABLE IF NOT EXISTS audit_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    guild_id VARCHAR(255) NOT NULL,
    action VARCHAR(100) NOT NULL,
    moderator_id VARCHAR(255) DEFAULT NULL,
    target_id VARCHAR(255) DEFAULT NULL,
    reason TEXT DEFAULT NULL,
    metadata JSON DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_guild_id (guild_id),
    INDEX idx_created_at (created_at)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

  `CREATE TABLE IF NOT EXISTS shop_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    guild_id VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT DEFAULT NULL,
    price BIGINT NOT NULL,
    role_id VARCHAR(255) DEFAULT NULL,
    stock INT DEFAULT -1,
    type VARCHAR(50) DEFAULT 'role',
    data JSON DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_guild_id (guild_id)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

  `CREATE TABLE IF NOT EXISTS role_panels (
    id INT AUTO_INCREMENT PRIMARY KEY,
    guild_id VARCHAR(255) NOT NULL,
    message_id VARCHAR(255) DEFAULT NULL,
    channel_id VARCHAR(255) DEFAULT NULL,
    title VARCHAR(255) DEFAULT 'Role Selection',
    description TEXT DEFAULT NULL,
    color VARCHAR(20) DEFAULT '#5865f2',
    style VARCHAR(20) DEFAULT 'button',
    max_roles INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_guild_id (guild_id),
    INDEX idx_message_id (message_id)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

  `CREATE TABLE IF NOT EXISTS role_panel_roles (
    id INT AUTO_INCREMENT PRIMARY KEY,
    panel_id INT NOT NULL,
    guild_id VARCHAR(255) NOT NULL,
    role_id VARCHAR(255) NOT NULL,
    label VARCHAR(255) DEFAULT NULL,
    emoji VARCHAR(100) DEFAULT NULL,
    description VARCHAR(255) DEFAULT NULL,
    color VARCHAR(20) DEFAULT '#5865f2',
    position INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_panel_id (panel_id),
    INDEX idx_guild_id (guild_id),
    FOREIGN KEY (panel_id) REFERENCES role_panels(id) ON DELETE CASCADE
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`
];

async function runMigrations() {
  let connection;
  try {
    connection = await mysql.createConnection({
      host: config.database.host,
      port: config.database.port,
      user: config.database.user,
      password: config.database.password,
      multipleStatements: true
    });

    await connection.query(`CREATE DATABASE IF NOT EXISTS \`${config.database.database}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
    await connection.query(`USE \`${config.database.database}\``);

    for (const sql of schemas) {
      await connection.execute(sql);
    }

    const missingColumns = [
      { column: 'ticket_panel_channel', def: 'VARCHAR(255) DEFAULT NULL', after: 'ticket_category' },
      { column: 'ticket_support_roles', def: 'TEXT DEFAULT NULL', after: 'ticket_panel_channel' },
      { column: 'ticket_log_channel', def: 'VARCHAR(255) DEFAULT NULL', after: 'ticket_support_roles' },
      { column: 'ticket_limit', def: 'INT DEFAULT 5', after: 'ticket_log_channel' },
      { column: 'mute_role', def: 'VARCHAR(255) DEFAULT NULL', after: 'ticket_limit' },
      { column: 'auto_mod_level', def: `VARCHAR(50) DEFAULT 'off'`, after: 'mute_role' },
    ];

    const [existingCols] = await connection.query(`SHOW COLUMNS FROM guilds`);
    const existingNames = new Set(existingCols.map(c => c.Field));

    for (const col of missingColumns) {
      if (!existingNames.has(col.column)) {
        await connection.execute(`ALTER TABLE guilds ADD COLUMN ${col.column} ${col.def} AFTER ${col.after}`);
      }
    }

    console.log('[Schema] All tables created successfully.');
  } catch (err) {
    console.error('[Schema] Migration failed:', err.message);
    process.exit(1);
  } finally {
    if (connection) await connection.end();
  }
}

if (require.main === module) {
  runMigrations().then(() => process.exit(0));
}

module.exports = { runMigrations, schemas };
