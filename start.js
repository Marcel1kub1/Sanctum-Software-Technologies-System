const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const REPO_URL = 'https://github.com/Marcel1kub1/Sanctum-Software-Technologies-System.git';
const BOT_DIR = path.join(__dirname, 'sanctum-bot');

console.log('==========================================');
console.log('  Sanctum Technologies - Setup & Launch');
console.log('==========================================');

if (!fs.existsSync(BOT_DIR)) {
  console.log('[Setup] Cloning repository...');
  execSync(`git clone ${REPO_URL} "${BOT_DIR}"`, { stdio: 'inherit' });
  console.log('[Setup] Clone complete.');
  console.log('[Setup] >>> Edit sanctum-bot/config.js with your Discord Bot Token, Client ID, Client Secret, and database credentials!');
} else {
  console.log('[Setup] Repository exists. Pulling latest...');
  execSync('git pull', { stdio: 'inherit', cwd: BOT_DIR });
}

if (!fs.existsSync(path.join(BOT_DIR, 'node_modules'))) {
  console.log('[Setup] Installing dependencies...');
  execSync('npm install', { stdio: 'inherit', cwd: BOT_DIR });
  console.log('[Setup] Dependencies installed.');
}

process.chdir(BOT_DIR);

console.log('==========================================');
console.log('  Sanctum Technologies - Starting');
console.log(`  Node Version: ${process.version}`);
console.log('==========================================');

require('./src/index');
