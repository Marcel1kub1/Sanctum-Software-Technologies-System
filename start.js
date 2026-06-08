const { execSync, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const REPO_URL = 'https://github.com/Marcel1kub1/Sanctum-Software-Technologies-System.git';
const TARGET = __dirname;
const TEMP_CLONE = path.join(TARGET, '_repo_clone');

console.log('==========================================');
console.log('  Sanctum Technologies - Setup & Launch');
console.log('==========================================');

if (!fs.existsSync(path.join(TARGET, 'src'))) {
  console.log('[Setup] Cloning repository...');
  execSync(`git clone ${REPO_URL} "${TEMP_CLONE}"`, { stdio: 'inherit' });
  const entries = fs.readdirSync(TEMP_CLONE);
  for (const entry of entries) {
    const src = path.join(TEMP_CLONE, entry);
    const dest = path.join(TARGET, entry);
    if (fs.existsSync(dest)) {
      fs.rmSync(dest, { recursive: true, force: true });
    }
    fs.renameSync(src, dest);
  }
  fs.rmSync(TEMP_CLONE, { recursive: true, force: true });
  console.log('[Setup] Clone complete. Restarting with latest start.js...');
  const child = spawn(process.argv[0], [path.join(TARGET, 'start.js')], {
    stdio: 'inherit', cwd: TARGET, env: process.env
  });
  child.on('exit', process.exit);
  return;
}

console.log('[Setup] Pulling latest changes...');
try {
  execSync('git pull', { stdio: 'inherit', cwd: TARGET });
} catch (e) {
  console.log('[Setup] Git pull skipped.');
}

if (!fs.existsSync(path.join(TARGET, 'node_modules'))) {
  console.log('[Setup] Installing dependencies...');
  execSync('npm install', { stdio: 'inherit', cwd: TARGET });
  console.log('[Setup] Dependencies installed.');
}

if (!fs.existsSync(path.join(TARGET, 'config.js'))) {
  console.error('[Error] config.js not found. Copy config.example.js to config.js and fill in your values.');
  process.exit(1);
}

console.log(`  Node Version: ${process.version}`);
console.log('==========================================');

require('./src/index');
