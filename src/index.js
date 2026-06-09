const { createPool } = require('./database/connection');
const { runMigrations } = require('./database/schema');
const Bot = require('./bot');
const config = require('../config');

async function start() {
  console.log('==========================================');
  console.log('  Sanctum Technologies');
  console.log('==========================================');

  await runMigrations();
  await createPool();

  let bot = null;
  if (config.bot.token && !config.bot.token.includes('your_')) {
    bot = new Bot();
    try {
      await bot.login();
    } catch (e) {
      console.warn('[Bot] Failed to login:', e.message);
      bot = bot || null;
    }
  } else {
    console.log('[Bot] No token configured — starting in dashboard-only mode');
  }

  // Start the web dashboard on the same process
  if (config.dashboard.enabled !== false) {
    try {
      const dashboard = require('../dashboard/server');
      dashboard(bot);
    } catch (err) {
      console.warn('[Dashboard] Failed to start:', err.message);
    }
  }

  process.on('unhandledRejection', (err) => {
    console.error('[FATAL] Unhandled Rejection:', err);
  });

  process.on('uncaughtException', (err) => {
    console.error('[FATAL] Uncaught Exception:', err);
  });
}

start();
