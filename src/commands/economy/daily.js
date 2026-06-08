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
    const userData = await db.getUser(message.author.id);
    const now = Date.now();
    const lastDaily = userData.daily_last ? new Date(userData.daily_last).getTime() : 0;
    if (now - lastDaily < 86400000) {
      const remaining = 86400000 - (now - lastDaily);
      await message.reply(`You can claim your daily in ${Math.ceil(remaining / 3600000)} hours.`);
      return;
    }
    await db.query('UPDATE users SET balance = balance + ?, daily_last = NOW() WHERE user_id = ?',
      [bot.config.economy.dailyAmount, message.author.id]);
    await message.reply(`You claimed ${bot.config.economy.currency}${bot.config.economy.dailyAmount} as your daily reward!`);
  }

  async executeSlash(bot, interaction) {
    await interaction.deferReply();
    const userData = await db.getUser(interaction.user.id);
    const now = Date.now();
    const lastDaily = userData.daily_last ? new Date(userData.daily_last).getTime() : 0;
    if (now - lastDaily < 86400000) {
      const remaining = 86400000 - (now - lastDaily);
      await interaction.editReply(`You can claim your daily in ${Math.ceil(remaining / 3600000)} hours.`);
      return;
    }
    await db.query('UPDATE users SET balance = balance + ?, daily_last = NOW() WHERE user_id = ?',
      [bot.config.economy.dailyAmount, interaction.user.id]);
    await interaction.editReply(`You claimed ${bot.config.economy.currency}${bot.config.economy.dailyAmount} as your daily reward!`);
  }
};
