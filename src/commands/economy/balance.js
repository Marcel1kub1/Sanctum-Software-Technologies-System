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
    const cfg = await bot.guildConfig(message.guild.id);
    const target = message.mentions.users.first() || message.author;
    const userData = await User.get(target.id);
    const currency = cfg.economy_currency || bot.config.economy.currency;
    await message.reply(`${target.username}'s balance: ${currency}${userData.balance}`);
  }

  async executeSlash(bot, interaction) {
    await interaction.deferReply();
    const cfg = await bot.guildConfig(interaction.guild.id);
    const target = interaction.options.getUser('user') || interaction.user;
    const userData = await User.get(target.id);
    const currency = cfg.economy_currency || bot.config.economy.currency;
    await interaction.editReply(`${target.username}'s balance: ${currency}${userData.balance}`);
  }
};
