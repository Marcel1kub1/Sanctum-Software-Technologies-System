const ms = require('ms');

function formatTime(msDuration) {
  const seconds = Math.floor((msDuration / 1000) % 60);
  const minutes = Math.floor((msDuration / (1000 * 60)) % 60);
  const hours = Math.floor((msDuration / (1000 * 60 * 60)) % 24);
  const days = Math.floor(msDuration / (1000 * 60 * 60 * 24));
  const parts = [];
  if (days > 0) parts.push(`${days} days`);
  if (hours > 0) parts.push(`${hours} hours`);
  if (minutes > 0) parts.push(`${minutes} minutes`);
  if (seconds > 0 || parts.length === 0) parts.push(`${seconds} seconds`);
  return parts.join(' ');
}

function parseTime(str) {
  return ms(str);
}

function randomRange(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function shuffleArray(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function paginate(arr, page, pageSize) {
  const start = (page - 1) * pageSize;
  const end = start + pageSize;
  return {
    items: arr.slice(start, end),
    total: arr.length,
    page,
    totalPages: Math.ceil(arr.length / pageSize),
    hasNext: end < arr.length,
    hasPrev: page > 1
  };
}

function escapeMarkdown(text) {
  return text.replace(/[_*~`|>]/g, '\\$&');
}

function truncate(str, len) {
  if (str.length <= len) return str;
  return str.slice(0, len - 3) + '...';
}

module.exports = { formatTime, parseTime, randomRange, shuffleArray, paginate, escapeMarkdown, truncate };
