const axios = require('axios');

const usageMap = new Map();

function getUsage() {
  return usageMap;
}

function checkUsage(userId, dailyLimit) {
  const today = new Date().toDateString();
  const entry = usageMap.get(userId);
  if (!entry || entry.date !== today) return 0;
  return entry.count;
}

function trackUsage(userId) {
  const today = new Date().toDateString();
  let entry = usageMap.get(userId);
  if (!entry || entry.date !== today) {
    entry = { count: 0, date: today };
  }
  entry.count++;
  usageMap.set(userId, entry);
  return entry.count;
}

async function getAIResponse(provider, apiKey, model, prompt, systemPrompt) {
  try {
    switch (provider) {
      case 'groq': {
        const res = await axios.post(
          'https://api.groq.com/openai/v1/chat/completions',
          {
            model: model || 'mixtral-8x7b-32768',
            messages: [
              ...(systemPrompt ? [{ role: 'system', content: systemPrompt }] : []),
              { role: 'user', content: prompt }
            ]
          },
          { headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' } }
        );
        return res.data.choices[0].message.content;
      }
      case 'openai': {
        const res = await axios.post(
          'https://api.openai.com/v1/chat/completions',
          {
            model: model || 'gpt-3.5-turbo',
            messages: [
              ...(systemPrompt ? [{ role: 'system', content: systemPrompt }] : []),
              { role: 'user', content: prompt }
            ]
          },
          { headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' } }
        );
        return res.data.choices[0].message.content;
      }
      case 'claude': {
        const res = await axios.post(
          'https://api.anthropic.com/v1/messages',
          {
            model: model || 'claude-3-haiku-20240307',
            max_tokens: 1024,
            system: systemPrompt || undefined,
            messages: [{ role: 'user', content: prompt }]
          },
          { headers: { 'x-api-key': apiKey, 'anthropic-version': '2023-06-01', 'Content-Type': 'application/json' } }
        );
        return res.data.content[0].text;
      }
      case 'gemini': {
        const contents = [];
        if (systemPrompt) {
          contents.push({ role: 'user', parts: [{ text: systemPrompt }] });
        }
        contents.push({ role: 'user', parts: [{ text: prompt }] });
        const res = await axios.post(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${apiKey}`,
          { contents },
          { headers: { 'Content-Type': 'application/json' } }
        );
        return res.data.candidates[0].content.parts[0].text;
      }
      default:
        return `Unknown provider: ${provider}`;
    }
  } catch (error) {
    if (error.response) {
      const detail = error.response.data?.error?.message || JSON.stringify(error.response.data);
      return `API error (${error.response.status}): ${detail}`;
    }
    return `Error: ${error.message}`;
  }
}

module.exports = { getAIResponse, checkUsage, trackUsage, getUsage };
