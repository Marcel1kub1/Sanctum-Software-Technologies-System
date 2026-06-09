const { SlashCommandBuilder } = require('discord.js');
const Command = require('../../structures/Command');
const db = require('../../database/connection');
const { randomRange } = require('../../utils/functions');

module.exports = class WorkCommand extends Command {
  constructor(bot) {
    super(bot);
    this.name = 'work';
    this.description = 'Work to earn some money';
    this.category = 'economy';
    this.cooldown = 300;
    this.slashData = new SlashCommandBuilder()
      .setName(this.name)
      .setDescription(this.description);
  }

  async execute(bot, message, args) {
    const cfg = await bot.guildConfig(message.guild.id);
    await db.getUser(message.author.id);
    const earned = randomRange(cfg.economy_work_min || bot.config.economy.workMin, cfg.economy_work_max || bot.config.economy.workMax);
    const currency = cfg.economy_currency || bot.config.economy.currency;
    await db.query('UPDATE users SET balance = balance + ? WHERE user_id = ?', [earned, message.author.id]);
    await message.reply(`You worked and earned ${currency}${earned}!`);
  }

  async executeSlash(bot, interaction) {
    await interaction.deferReply();
    const cfg = await bot.guildConfig(interaction.guild.id);
    await db.getUser(interaction.user.id);
    const earned = randomRange(cfg.economy_work_min || bot.config.economy.workMin, cfg.economy_work_max || bot.config.economy.workMax);
    const currency = cfg.economy_currency || bot.config.economy.currency;
    await db.query('UPDATE users SET balance = balance + ? WHERE user_id = ?', [earned, interaction.user.id]);
    await interaction.editReply(`You worked and earned ${currency}${earned}!`);
  }
};
