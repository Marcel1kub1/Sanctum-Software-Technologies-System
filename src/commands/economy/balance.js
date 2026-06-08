const { SlashCommandBuilder } = require('discord.js');
const Command = require('../../structures/Command');
const User = require('../../structures/models/User');

module.exports = class BalanceCommand extends Command {
  constructor(bot) {
    super(bot);
    this.name = 'balance';
    this.description = 'Check your or another user\'s balance';
    this.category = 'economy';
    this.slashData = new SlashCommandBuilder()
      .setName(this.name)
      .setDescription(this.description)
      .addUserOption(opt => opt.setName('user').setDescription('The user to check').setRequired(false));
  }

  async execute(bot, message, args) {
    const target = message.mentions.users.first() || message.author;
    const userData = await User.get(target.id);
    await message.reply(`${target.username}'s balance: ${bot.config.economy.currency}${userData.balance}`);
  }

  async executeSlash(bot, interaction) {
    await interaction.deferReply();
    const target = interaction.options.getUser('user') || interaction.user;
    const userData = await User.get(target.id);
    await interaction.editReply(`${target.username}'s balance: ${bot.config.economy.currency}${userData.balance}`);
  }
};
