const fs = require('fs');
const path = require('path');

const OVERRIDE_PATH = path.resolve(__dirname, '../../config.override.json');

let mergedConfig = null;

function deepMerge(base, override) {
  const result = { ...base };
  for (const key of Object.keys(override)) {
    if (override[key] && typeof override[key] === 'object' && !Array.isArray(override[key]) && base[key] && typeof base[key] === 'object') {
      result[key] = deepMerge(base[key], override[key]);
    } else {
      result[key] = override[key];
    }
  }
  return result;
}

function loadConfig() {
  if (mergedConfig) return mergedConfig;
  const baseConfig = require('../../config');
  let override = {};
  try {
    if (fs.existsSync(OVERRIDE_PATH)) {
      override = JSON.parse(fs.readFileSync(OVERRIDE_PATH, 'utf-8'));
    }
  } catch (e) {
    console.warn('[ConfigLoader] Failed to load override config:', e.message);
  }
  mergedConfig = deepMerge(baseConfig, override);
  return mergedConfig;
}

function saveOverride(partial) {
  let existing = {};
  try {
    if (fs.existsSync(OVERRIDE_PATH)) {
      existing = JSON.parse(fs.readFileSync(OVERRIDE_PATH, 'utf-8'));
    }
  } catch {}
  const updated = { ...existing };
  for (const [key, val] of Object.entries(partial)) {
    if (val && typeof val === 'object' && !Array.isArray(val) && existing[key] && typeof existing[key] === 'object') {
      updated[key] = { ...existing[key], ...val };
    } else {
      updated[key] = val;
    }
  }
  fs.writeFileSync(OVERRIDE_PATH, JSON.stringify(updated, null, 2), 'utf-8');
  mergedConfig = null;
  return loadConfig();
}

module.exports = { loadConfig, saveOverride };
