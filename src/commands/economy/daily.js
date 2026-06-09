const { SlashCommandBuilder } = require('discord.js');
const Command = require('../../structures/Command');
const db = require('../../database/connection');

module.exports = class DailyCommand extends Command {
  constructor(bot) {
    super(bot);
    this.name = 'daily';
    this.description = 'Claim your daily reward';
    this.category = 'economy';
    this.cooldown = 86400;
    this.slashData = new SlashCommandBuilder()
      .setName(this.name)
      .setDescription(this.description);
  }

  async execute(bot, message, args) {
    const cfg = await bot.guildConfig(message.guild.id);
    const userData = await db.getUser(message.author.id);
    const now = Date.now();
    const lastDaily = userData.daily_last ? new Date(userData.daily_last).getTime() : 0;
    if (now - lastDaily < 86400000) {
      const remaining = 86400000 - (now - lastDaily);
      await message.reply(`You can claim your daily in ${Math.ceil(remaining / 3600000)} hours.`);
      return;
    }
    const amount = cfg.economy_daily_amount || bot.config.economy.dailyAmount;
    const currency = cfg.economy_currency || bot.config.economy.currency;
    await db.query('UPDATE users SET balance = balance + ?, daily_last = NOW() WHERE user_id = ?',
      [amount, message.author.id]);
    await message.reply(`You claimed ${currency}${amount} as your daily reward!`);
  }

  async executeSlash(bot, interaction) {
    await interaction.deferReply();
    const cfg = await bot.guildConfig(interaction.guild.id);
    const userData = await db.getUser(interaction.user.id);
    const now = Date.now();
    const lastDaily = userData.daily_last ? new Date(userData.daily_last).getTime() : 0;
    if (now - lastDaily < 86400000) {
      const remaining = 86400000 - (now - lastDaily);
      await interaction.editReply(`You can claim your daily in ${Math.ceil(remaining / 3600000)} hours.`);
      return;
    }
    const amount = cfg.economy_daily_amount || bot.config.economy.dailyAmount;
    const currency = cfg.economy_currency || bot.config.economy.currency;
    await db.query('UPDATE users SET balance = balance + ?, daily_last = NOW() WHERE user_id = ?',
      [amount, interaction.user.id]);
    await interaction.editReply(`You claimed ${currency}${amount} as your daily reward!`);
  }
};
