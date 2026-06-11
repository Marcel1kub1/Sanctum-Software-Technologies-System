const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const Command = require('../../structures/Command');

module.exports = class DiceCommand extends Command {
  constructor(bot) {
    super(bot);
    this.name = 'dice';
    this.description = 'Roll some dice';
    this.category = 'fun';
    this.aliases = ['roll'];
    this.permissions = [];
    this.slashData = new SlashCommandBuilder()
      .setName(this.name)
      .setDescription(this.description)
      .addIntegerOption(opt => opt.setName('sides').setDescription('Number of sides').setRequired(false))
      .addIntegerOption(opt => opt.setName('count').setDescription('Number of dice').setRequired(false));
  }

  async execute(bot, message, args) {
    const sides = parseInt(args[0], 10) || 6;
    const count = Math.min(parseInt(args[1], 10) || 1, 20);
    if (sides < 2) { await message.reply('Sides must be at least 2.'); return; }
    if (count < 1) { await message.reply('Count must be at least 1.'); return; }
    const results = [];
    for (let i = 0; i < count; i++) {
      results.push(Math.floor(Math.random() * sides) + 1);
    }
    const embed = new EmbedBuilder()
      .setTitle(`🎲 Rolling ${count}d${sides}`)
      .setDescription(results.join(', '))
      .setColor(0x5865F2);
    await message.reply({ embeds: [embed] });
  }

  async executeSlash(bot, interaction) {
    const sides = interaction.options.getInteger('sides') || 6;
    const count = Math.min(interaction.options.getInteger('count') || 1, 20);
    if (sides < 2) { await interaction.reply('Sides must be at least 2.'); return; }
    if (count < 1) { await interaction.reply('Count must be at least 1.'); return; }
    const results = [];
    for (let i = 0; i < count; i++) {
      results.push(Math.floor(Math.random() * sides) + 1);
    }
    const embed = new EmbedBuilder()
      .setTitle(`🎲 Rolling ${count}d${sides}`)
      .setDescription(results.join(', '))
      .setColor(0x5865F2);
    await interaction.reply({ embeds: [embed] });
  }
};
