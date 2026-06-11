const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const Command = require('../../structures/Command');

module.exports = class ShipCommand extends Command {
  constructor(bot) {
    super(bot);
    this.name = 'ship';
    this.description = 'Ship two users together';
    this.category = 'fun';
    this.aliases = ['love'];
    this.permissions = [];
    this.slashData = new SlashCommandBuilder()
      .setName(this.name)
      .setDescription(this.description)
      .addUserOption(opt => opt.setName('user1').setDescription('First user').setRequired(true))
      .addUserOption(opt => opt.setName('user2').setDescription('Second user').setRequired(true));
  }

  getShip(percent) {
    if (percent < 20) return '💔 Awful... just awful.';
    if (percent < 40) return '❤️ Not great, not terrible.';
    if (percent < 60) return '💗 There is some potential!';
    if (percent < 80) return '💖 A strong couple!';
    return '💕 A match made in heaven!';
  }

  async execute(bot, message, args) {
    const user1 = message.mentions.users.first();
    const user2 = message.mentions.users.last();
    if (!user1 || !user2 || user1.id === user2.id) {
      await message.reply('Mention two different users to ship.');
      return;
    }
    const percent = Math.floor(Math.random() * 101);
    const embed = new EmbedBuilder()
      .setTitle(`💞 ${user1.username} x ${user2.username}`)
      .setDescription(`**${percent}%**\n${this.getShip(percent)}`)
      .setColor(0xFF69B4);
    await message.reply({ embeds: [embed] });
  }

  async executeSlash(bot, interaction) {
    const user1 = interaction.options.getUser('user1');
    const user2 = interaction.options.getUser('user2');
    if (user1.id === user2.id) {
      await interaction.reply('You cannot ship someone with themselves!');
      return;
    }
    const percent = Math.floor(Math.random() * 101);
    const embed = new EmbedBuilder()
      .setTitle(`💞 ${user1.username} x ${user2.username}`)
      .setDescription(`**${percent}%**\n${this.getShip(percent)}`)
      .setColor(0xFF69B4);
    await interaction.reply({ embeds: [embed] });
  }
};
