const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const Command = require('../../structures/Command');

module.exports = class HelpCommand extends Command {
  constructor(bot) {
    super(bot);
    this.name = 'help';
    this.description = 'Show all available commands';
    this.category = 'utility';
    this.slashData = new SlashCommandBuilder()
      .setName(this.name)
      .setDescription(this.description)
      .addStringOption(opt => opt.setName('command').setDescription('Get help for a specific command').setRequired(false));
  }

  async execute(bot, message, args) {
    const embed = new EmbedBuilder()
      .setTitle('Sanctum Technologies Commands')
      .setColor(0x5865F2)
      .setDescription('Use `!help <command>` for details on a specific command.');

    const categories = {};
    bot.commands.forEach(cmd => {
      if (!categories[cmd.category]) categories[cmd.category] = [];
      categories[cmd.category].push(`\`${cmd.name}\``);
    });

    for (const [cat, cmds] of Object.entries(categories)) {
      embed.addFields({ name: cat.charAt(0).toUpperCase() + cat.slice(1), value: cmds.join(', '), inline: false });
    }

    await message.reply({ embeds: [embed] });
  }

  async executeSlash(bot, interaction) {
    const embed = new EmbedBuilder()
      .setTitle('Sanctum Technologies Commands')
      .setColor(0x5865F2);

    const categories = {};
    bot.commands.forEach(cmd => {
      if (!categories[cmd.category]) categories[cmd.category] = [];
      categories[cmd.category].push(`\`${cmd.name}\``);
    });

    for (const [cat, cmds] of Object.entries(categories)) {
      embed.addFields({ name: cat.charAt(0).toUpperCase() + cat.slice(1), value: cmds.join(', '), inline: false });
    }

    await interaction.reply({ embeds: [embed] });
  }
};
