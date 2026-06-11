const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const Command = require('../../structures/Command');

module.exports = class IqCommand extends Command {
  constructor(bot) {
    super(bot);
    this.name = 'iq';
    this.description = 'Check someone\'s IQ';
    this.category = 'fun';
    this.aliases = ['smart'];
    this.permissions = [];
    this.slashData = new SlashCommandBuilder()
      .setName(this.name)
      .setDescription(this.description)
      .addUserOption(opt => opt.setName('user').setDescription('The user').setRequired(false));
  }

  async execute(bot, message, args) {
    const target = message.mentions.users.first() || message.author;
    const seed = target.id.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
    const iq = 70 + (seed % 91);
    const embed = new EmbedBuilder()
      .setTitle('🧠 IQ Test')
      .setDescription(`${target.username}'s IQ is **${iq}**`)
      .setColor(0x00FF00);
    await message.reply({ embeds: [embed] });
  }

  async executeSlash(bot, interaction) {
    const target = interaction.options.getUser('user') || interaction.user;
    const seed = target.id.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
    const iq = 70 + (seed % 91);
    const embed = new EmbedBuilder()
      .setTitle('🧠 IQ Test')
      .setDescription(`${target.username}'s IQ is **${iq}**`)
      .setColor(0x00FF00);
    await interaction.reply({ embeds: [embed] });
  }
};
