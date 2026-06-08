const fs = require('fs');
const path = require('path');

function loadEvents(bot) {
  const eventsDir = path.join(__dirname, '..', 'events');
  if (!fs.existsSync(eventsDir)) return;

  const files = fs.readdirSync(eventsDir).filter(f => f.endsWith('.js'));
  for (const file of files) {
    const event = require(path.join(eventsDir, file));
    const eventName = file.replace('.js', '');

    if (event.once) {
      bot.once(eventName, (...args) => event.execute(bot, ...args));
    } else {
      bot.on(eventName, (...args) => event.execute(bot, ...args));
    }
    console.log(`[Events] Loaded: ${eventName}`);
  }

  console.log(`[Events] Loaded ${files.length} event(s)`);
}

module.exports = { loadEvents };
