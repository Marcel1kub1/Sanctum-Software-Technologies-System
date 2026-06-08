const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const ROOT = __dirname;

console.log('==========================================');
console.log('  Sanctum Technologies - Starting');
console.log('==========================================');

if (!fs.existsSync(path.join(ROOT, 'node_modules'))) {
  console.log('[Setup] Installing dependencies...');
  execSync('npm install', { stdio: 'inherit', cwd: ROOT });
  console.log('[Setup] Dependencies installed.');
}

if (!fs.existsSync(path.join(ROOT, 'config.js'))) {
  console.error('[Error] config.js not found. Copy config.example.js to config.js and fill in your values.');
  process.exit(1);
}

console.log(`  Node Version: ${process.version}`);
console.log('==========================================');

require('./src/index');
