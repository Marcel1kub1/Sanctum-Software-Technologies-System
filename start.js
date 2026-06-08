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
} else {
  console.log('[Setup] Repository exists. Pulling latest...');
  execSync('git pull', { stdio: 'inherit', cwd: BOT_DIR });
}

if (!fs.existsSync(path.join(BOT_DIR, 'node_modules'))) {
  console.log('[Setup] Installing dependencies...');
  execSync('npm install', { stdio: 'inherit', cwd: BOT_DIR });
  console.log('[Setup] Dependencies installed.');
}

const envPath = path.join(BOT_DIR, '.env');
const envExample = path.join(BOT_DIR, '.env.example');
if (!fs.existsSync(envPath) && fs.existsSync(envExample)) {
  fs.copyFileSync(envExample, envPath);
  console.log('[Setup] Created .env from .env.example');
  console.log('[Setup] >>> Edit sanctum-bot/.env with your Discord Bot Token, Client ID, and Client Secret!');
}

process.chdir(BOT_DIR);

console.log('==========================================');
console.log('  Sanctum Technologies - Starting');
console.log(`  Node Version: ${process.version}`);
console.log('==========================================');

require('./src/index');
