const fs = require('fs');
const path = require('path');

function loadCommands(bot) {
  const categories = [
    'moderation', 'music', 'economy', 'tickets',
    'giveaways', 'utility', 'fun', 'welcome',
    'leveling', 'security'
  ];

  for (const category of categories) {
    const dir = path.join(__dirname, '..', 'commands', category);
    if (!fs.existsSync(dir)) continue;

    const files = fs.readdirSync(dir).filter(f => f.endsWith('.js'));
    for (const file of files) {
      const Command = require(path.join(dir, file));
      const command = new Command(bot);

      if (command.name) {
        bot.commands.set(command.name, command);
        if (command.slashData) {
          bot.slashCommands.set(command.name, command);
        }
        console.log(`[Commands] Loaded: ${category}/${command.name}`);
      }
    }
  }

  console.log(`[Commands] Loaded ${bot.commands.size} prefix commands, ${bot.slashCommands.size} slash commands`);
}

async function registerSlashCommands(bot) {
  const commands = bot.slashCommands.map(c => c.slashData.toJSON ? c.slashData.toJSON() : c.slashData);
  try {
    await bot.application.commands.set(commands);
    console.log(`[Commands] Registered ${commands.length} global slash commands`);
  } catch (err) {
    console.error('[Commands] Failed to register slash commands:', err.message);
  }
}

module.exports = { loadCommands, registerSlashCommands };
