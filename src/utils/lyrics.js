const axios = require('axios');

function stripHtml(html) {
  return html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/\n\s+\n/g, '\n\n')
    .trim();
}

async function fetchFromGenius(artist, title, token) {
  if (!token) return null;
  try {
    const q = encodeURIComponent(`${artist} ${title}`);
    const res = await axios.get(`https://api.genius.com/search?q=${q}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const hit = res.data.response.hits && res.data.response.hits[0];
    if (!hit) return null;
    const url = hit.result.url;
    const page = await axios.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
    const html = page.data;

    // New Genius layout uses multiple <div data-lyrics-container="true"> blocks
    const containerRegex = /<div[^>]*data-lyrics-container[^>]*>([\s\S]*?)<\/div>/gi;
    const matches = [];
    let m;
    while ((m = containerRegex.exec(html)) !== null) {
      matches.push(stripHtml(m[1]));
    }
    if (matches.length > 0) return matches.join('\n\n');

    // Fallback: older <div class="lyrics"> block
    const legacy = /<div[^>]*class="lyrics"[^>]*>([\s\S]*?)<\/div>/i.exec(html);
    if (legacy) return stripHtml(legacy[1]);

    return null;
  } catch (err) {
    return null;
  }
}

async function fetchFromLyricsOvh(artist, title) {
  try {
    const res = await axios.get(`https://api.lyrics.ovh/v1/${encodeURIComponent(artist)}/${encodeURIComponent(title)}`);
    return res.data?.lyrics || null;
  } catch {
    return null;
  }
}

async function fetchLyrics(artist, title, config = {}) {
  if (!config || config.enabled === false) return null;
  const provider = config.provider || 'lyrics.ovh';
  if (provider === 'genius') {
    return await fetchFromGenius(artist, title, config.geniusToken || config.genius_token || null);
  }
  return await fetchFromLyricsOvh(artist, title);
}

module.exports = { fetchLyrics };
