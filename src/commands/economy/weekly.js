const { SlashCommandBuilder } = require('discord.js');
const Command = require('../../structures/Command');
const db = require('../../database/connection');

module.exports = class WeeklyCommand extends Command {
  constructor(bot) {
    super(bot);
    this.name = 'weekly';
    this.description = 'Claim your weekly reward';
    this.category = 'economy';
    this.slashData = new SlashCommandBuilder()
      .setName(this.name)
      .setDescription(this.description);
  }

  async execute(bot, message, args) {
    const cfg = await bot.guildConfig(message.guild.id);

    let rows = await db.query('SELECT * FROM economy WHERE user_id = ?', [message.author.id]);
    if (rows.length === 0) {
      await db.query('INSERT INTO economy (user_id, balance, last_weekly_time) VALUES (?, 0, 0)', [message.author.id]);
      rows = await db.query('SELECT * FROM economy WHERE user_id = ?', [message.author.id]);
    }
    const userData = rows[0];

    const now = Date.now();
    const weekMs = 7 * 24 * 60 * 60 * 1000;
    if (now - userData.last_weekly_time < weekMs) {
      const remaining = weekMs - (now - userData.last_weekly_time);
      const days = Math.floor(remaining / (24 * 60 * 60 * 1000));
      const hours = Math.floor((remaining % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));
      await message.reply(`You can claim your weekly reward in ${days} day(s) and ${hours} hour(s).`);
      return;
    }

    const amount = cfg.economy_weekly_amount || bot.config.economy.weeklyAmount || 500;
    const currency = cfg.economy_currency || bot.config.economy.currency;

    await db.query('UPDATE economy SET balance = balance + ?, last_weekly_time = ? WHERE user_id = ?',
      [amount, now, message.author.id]);
    await message.reply(`You claimed ${currency}${amount} as your weekly reward!`);
  }

  async executeSlash(bot, interaction) {
    await interaction.deferReply();
    const cfg = await bot.guildConfig(interaction.guild.id);

    let rows = await db.query('SELECT * FROM economy WHERE user_id = ?', [interaction.user.id]);
    if (rows.length === 0) {
      await db.query('INSERT INTO economy (user_id, balance, last_weekly_time) VALUES (?, 0, 0)', [interaction.user.id]);
      rows = await db.query('SELECT * FROM economy WHERE user_id = ?', [interaction.user.id]);
    }
    const userData = rows[0];

    const now = Date.now();
    const weekMs = 7 * 24 * 60 * 60 * 1000;
    if (now - userData.last_weekly_time < weekMs) {
      const remaining = weekMs - (now - userData.last_weekly_time);
      const days = Math.floor(remaining / (24 * 60 * 60 * 1000));
      const hours = Math.floor((remaining % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));
      await interaction.editReply(`You can claim your weekly reward in ${days} day(s) and ${hours} hour(s).`);
      return;
    }

    const amount = cfg.economy_weekly_amount || bot.config.economy.weeklyAmount || 500;
    const currency = cfg.economy_currency || bot.config.economy.currency;

    await db.query('UPDATE economy SET balance = balance + ?, last_weekly_time = ? WHERE user_id = ?',
      [amount, now, interaction.user.id]);
    await interaction.editReply(`You claimed ${currency}${amount} as your weekly reward!`);
  }
};
