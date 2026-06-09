const { SlashCommandBuilder } = require('discord.js');
const Command = require('../../structures/Command');
const db = require('../../database/connection');

module.exports = class GiveCommand extends Command {
  constructor(bot) {
    super(bot);
    this.name = 'give';
    this.description = 'Give money to another user';
    this.category = 'economy';
    this.slashData = new SlashCommandBuilder()
      .setName(this.name)
      .setDescription(this.description)
      .addUserOption(opt => opt.setName('user').setDescription('The user to give money to').setRequired(true))
      .addIntegerOption(opt => opt.setName('amount').setDescription('Amount to give').setRequired(true).setMinValue(1));
  }

  async execute(bot, message, args) {
    const cfg = await bot.guildConfig(message.guild.id);
    const target = message.mentions.users.first();
    if (!target) {
      await message.reply('Please mention a user.');
      return;
    }
    const amount = parseInt(args[1]);
    if (!amount || amount < 1) {
      await message.reply('Enter a valid amount.');
      return;
    }
    const sender = await db.getUser(message.author.id);
    if (sender.balance < amount) {
      await message.reply('You don\'t have enough money.');
      return;
    }
    await db.query('UPDATE users SET balance = balance - ? WHERE user_id = ?', [amount, message.author.id]);
    await db.getUser(target.id);
    await db.query('UPDATE users SET balance = balance + ? WHERE user_id = ?', [amount, target.id]);
    const currency = cfg.economy_currency || bot.config.economy.currency;
    await message.reply(`You gave ${currency}${amount} to ${target.username}.`);
  }

  async executeSlash(bot, interaction) {
    const cfg = await bot.guildConfig(interaction.guild.id);
    const target = interaction.options.getUser('user');
    const amount = interaction.options.getInteger('amount');
    const sender = await db.getUser(interaction.user.id);
    if (sender.balance < amount) {
      await interaction.reply({ content: 'You don\'t have enough money.', ephemeral: true });
      return;
    }
    await interaction.deferReply();
    await db.query('UPDATE users SET balance = balance - ? WHERE user_id = ?', [amount, interaction.user.id]);
    await db.getUser(target.id);
    await db.query('UPDATE users SET balance = balance + ? WHERE user_id = ?', [amount, target.id]);
    const currency = cfg.economy_currency || bot.config.economy.currency;
    await interaction.editReply(`You gave ${currency}${amount} to ${target.username}.`);
  }
};
