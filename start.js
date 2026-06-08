const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

async function start() {
  console.log('==========================================');
  console.log('  Sanctum Technologies - Starting...');
  console.log('==========================================');

  try {
    console.log('[Startup] Pulling latest changes...');
    execSync('git pull', { stdio: 'inherit' });
  } catch (e) {
    console.log('[Startup] Git pull skipped (not a git repo or offline).');
  }

  if (!fs.existsSync(path.join(__dirname, 'node_modules'))) {
    console.log('[Startup] Installing dependencies...');
    execSync('npm install', { stdio: 'inherit' });
    console.log('[Startup] Dependencies installed.');
  }

  if (!fs.existsSync(path.join(__dirname, '.env')) && fs.existsSync(path.join(__dirname, '.env.example'))) {
    fs.copyFileSync(path.join(__dirname, '.env.example'), path.join(__dirname, '.env'));
    console.log('[Startup] Created .env from example — edit it with your credentials!');
  }

  console.log('==========================================');
  console.log('  Sanctum Technologies - Running');
  console.log(`  Node Version: ${process.version}`);
  console.log('==========================================');

  require('./src/index');
}

start().catch(err => {
  console.error('[Startup] Fatal error:', err);
  process.exit(1);
});
