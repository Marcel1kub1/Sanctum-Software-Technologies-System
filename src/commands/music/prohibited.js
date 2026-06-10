const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const Command = require('../../structures/Command');
const { list, add, remove } = require('../../utils/prohibitedSongs');

module.exports = class ProhibitedCommand extends Command {
  constructor(bot) {
    super(bot);
    this.name = 'prohibited';
    this.description = 'Manage prohibited song patterns';
    this.category = 'music';
    this.permissions = ['ManageMessages'];
    this.slashData = new SlashCommandBuilder()
      .setName(this.name)
      .setDescription(this.description)
      .addSubcommand(sub => sub.setName('add').setDescription('Add a prohibited pattern').addStringOption(opt => opt.setName('pattern').setDescription('Text to match against song title/author').setRequired(true)))
      .addSubcommand(sub => sub.setName('remove').setDescription('Remove a prohibited pattern').addStringOption(opt => opt.setName('pattern').setDescription('Pattern to remove').setRequired(true)))
      .addSubcommand(sub => sub.setName('list').setDescription('List all prohibited patterns'));
  }

  async execute(bot, message, args) {
    const guildId = message.guild.id;
    const sub = args[0]?.toLowerCase();
    if (sub === 'add') {
      const pattern = args.slice(1).join(' ');
      if (!pattern) return message.reply('Provide a pattern to add.');
      if (await add(guildId, pattern)) return message.reply(`Added prohibited pattern: **${pattern}**`);
      return message.reply('That pattern already exists.');
    }
    if (sub === 'remove') {
      const pattern = args.slice(1).join(' ');
      if (!pattern) return message.reply('Provide a pattern to remove.');
      if (await remove(guildId, pattern)) return message.reply(`Removed prohibited pattern: **${pattern}**`);
      return message.reply('Pattern not found.');
    }
    if (sub === 'list') {
      const patterns = await list(guildId);
      if (patterns.length === 0) return message.reply('No prohibited patterns configured.');
      const embed = new EmbedBuilder()
        .setColor(0xFF0000)
        .setTitle('Prohibited Song Patterns')
        .setDescription(patterns.map((p, i) => `${i + 1}. ${p}`).join('\n'));
      return message.reply({ embeds: [embed] });
    }
    return message.reply('Usage: `!prohibited add/remove/list <pattern>`');
  }

  async executeSlash(bot, interaction) {
    const guildId = interaction.guild.id;
    const sub = interaction.options.getSubcommand();
    if (sub === 'add') {
      const pattern = interaction.options.getString('pattern');
      if (await add(guildId, pattern)) return interaction.reply(`Added prohibited pattern: **${pattern}**`);
      return interaction.reply('That pattern already exists.');
    }
    if (sub === 'remove') {
      const pattern = interaction.options.getString('pattern');
      if (await remove(guildId, pattern)) return interaction.reply(`Removed prohibited pattern: **${pattern}**`);
      return interaction.reply('Pattern not found.');
    }
    if (sub === 'list') {
      const patterns = await list(guildId);
      if (patterns.length === 0) return interaction.reply('No prohibited patterns configured.');
      const embed = new EmbedBuilder()
        .setColor(0xFF0000)
        .setTitle('Prohibited Song Patterns')
        .setDescription(patterns.map((p, i) => `${i + 1}. ${p}`).join('\n'));
      return interaction.reply({ embeds: [embed] });
    }
  }
};
