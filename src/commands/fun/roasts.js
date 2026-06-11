const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const Command = require('../../structures/Command');

const roasts = [
  'You\'re not stupid; you just have bad luck thinking.',
  'I\'d agree with you, but then we\'d both be wrong.',
  'You bring everyone so much joy — when you leave.',
  'I\'ve seen salads more intimidating than you.',
  'You\'re proof that evolution can go in reverse.',
  'If I wanted to kill myself, I\'d climb your ego and jump to your IQ.',
  'You\'re so slow, even a snail would finish your sentences.',
  'You\'re like a cloud. When you disappear, it\'s a beautiful day.',
  'Your brain is like the Bermuda Triangle — ideas get lost in there.',
  'I\'d call you a tool, but that would imply you\'re useful.',
  'You\'re the reason God created the middle finger.',
  'Somewhere, a tree is producing oxygen for you. I think you owe it an apology.',
  'You\'re so full of yourself, you squeak when you walk.',
  'I\'d tell you to go outside, but the sun doesn\'t want you either.',
  'You\'re not a complete idiot — some parts are missing.',
  'Your secrets are safe with me. I never listen anyway.',
  'You have the right to remain silent. Please use it.',
  'If you were any more pathetic, you\'d be a Sim with no pool ladder.',
  'You\'re like a broken pencil — pointless.',
  'I\'d roast you, but my mom said not to burn trash.',
  'You\'re the human equivalent of a participation trophy.',
  'I\'d explain it to you, but I left my crayons at home.',
];

module.exports = class RoastsCommand extends Command {
  constructor(bot) {
    super(bot);
    this.name = 'roast';
    this.description = 'Roast someone';
    this.category = 'fun';
    this.aliases = ['burn'];
    this.permissions = [];
    this.slashData = new SlashCommandBuilder()
      .setName(this.name)
      .setDescription(this.description)
      .addUserOption(opt => opt.setName('user').setDescription('User to roast').setRequired(true));
  }

  async execute(bot, message, args) {
    const target = message.mentions.users.first();
    if (!target) {
      await message.reply('Mention someone to roast.');
      return;
    }
    const roast = roasts[Math.floor(Math.random() * roasts.length)];
    const embed = new EmbedBuilder()
      .setTitle(`🔥 Roasting ${target.username}`)
      .setDescription(`${target}, ${roast}`)
      .setColor(0xFF4500);
    await message.reply({ embeds: [embed] });
  }

  async executeSlash(bot, interaction) {
    const target = interaction.options.getUser('user');
    const roast = roasts[Math.floor(Math.random() * roasts.length)];
    const embed = new EmbedBuilder()
      .setTitle(`🔥 Roasting ${target.username}`)
      .setDescription(`${target}, ${roast}`)
      .setColor(0xFF4500);
    await interaction.reply({ embeds: [embed] });
  }
};
