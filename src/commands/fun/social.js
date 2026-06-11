const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const Command = require('../../structures/Command');

const actions = {
  hug: {
    emoji: '🤗',
    messages: [
      '{author} gave {target} a warm hug!',
      '{author} wraps their arms around {target}. So sweet!',
      '{author} hugs {target} tightly. Group hug!',
      '{author} showers {target} with hugs!',
      '{author} gives {target} a big bear hug!',
    ],
  },
  kiss: {
    emoji: '💋',
    messages: [
      '{author} gives {target} a gentle kiss!',
      '{author} plants a kiss on {target}!',
      '{author} smooches {target}! How romantic!',
      '{author} blew a kiss to {target}!',
      '{author} kisses {target} on the cheek!',
    ],
  },
  slap: {
    emoji: '👋',
    messages: [
      '{author} slaps {target} across the face! Ouch!',
      '{author} gives {target} a hard slap!',
      '{author} slaps {target} with a trout!',
      '{author} slaps {target} silly!',
      '{author} delivers a mighty slap to {target}!',
    ],
  },
  pat: {
    emoji: '🖐️',
    messages: [
      '{author} pats {target} on the head. Good job!',
      '{author} gives {target} a gentle pat!',
      '{author} pats {target} reassuringly.',
      '{author} pats {target}\'s back. There there!',
      '{author} gives {target} some headpats!',
    ],
  },
  poke: {
    emoji: '👉',
    messages: [
      '{author} pokes {target}!',
      '{author} pokes {target} repeatedly. Stop it!',
      '{author} gives {target} a little poke!',
      '{author} pokes {target} in the ribs!',
      '{author} keeps poking {target} for attention!',
    ],
  },
  cuddle: {
    emoji: '🫂',
    messages: [
      '{author} cuddles with {target}! So cozy!',
      '{author} snuggles up to {target}!',
      '{author} gives {target} a warm cuddle session!',
      '{author} and {target} cuddle together!',
      '{author} wraps {target} in a loving cuddle!',
    ],
  },
};

module.exports = class SocialCommand extends Command {
  constructor(bot) {
    super(bot);
    this.name = 'social';
    this.description = 'Social interaction commands';
    this.category = 'fun';
    this.aliases = ['hug', 'kiss', 'slap', 'pat', 'poke', 'cuddle'];
    this.permissions = [];
    this.slashData = new SlashCommandBuilder()
      .setName(this.name)
      .setDescription(this.description);
    for (const action of Object.keys(actions)) {
      this.slashData.addSubcommand(sub =>
        sub.setName(action)
          .setDescription(`Give someone a ${action}`)
          .addUserOption(opt => opt.setName('user').setDescription('The target').setRequired(true))
      );
    }
  }

  async execute(bot, message, args) {
    const actionName = message.content.slice(bot.prefix.length).split(/ +/)[0].toLowerCase();
    const action = actions[actionName] || actions.hug;
    const target = message.mentions.users.first();
    if (!target) {
      await message.reply(`You need to mention someone to ${actionName}.`);
      return;
    }
    const msg = action.messages[Math.floor(Math.random() * action.messages.length)]
      .replace('{author}', message.author)
      .replace('{target}', target);
    const embed = new EmbedBuilder()
      .setTitle(`${action.emoji} ${actionName.charAt(0).toUpperCase() + actionName.slice(1)}`)
      .setDescription(msg)
      .setColor(0xFF69B4);
    await message.reply({ embeds: [embed] });
  }

  async executeSlash(bot, interaction) {
    const actionName = interaction.options.getSubcommand();
    const action = actions[actionName];
    if (!action) {
      await interaction.reply('Unknown social action.');
      return;
    }
    const target = interaction.options.getUser('user');
    const msg = action.messages[Math.floor(Math.random() * action.messages.length)]
      .replace('{author}', interaction.user)
      .replace('{target}', target);
    const embed = new EmbedBuilder()
      .setTitle(`${action.emoji} ${actionName.charAt(0).toUpperCase() + actionName.slice(1)}`)
      .setDescription(msg)
      .setColor(0xFF69B4);
    await interaction.reply({ embeds: [embed] });
  }
};
