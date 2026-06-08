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
    const earned = randomRange(bot.config.economy.workMin, bot.config.economy.workMax);
    await db.query('UPDATE users SET balance = balance + ? WHERE user_id = ?', [earned, message.author.id]);
    await message.reply(`You worked and earned ${bot.config.economy.currency}${earned}!`);
  }

  async executeSlash(bot, interaction) {
    await interaction.deferReply();
    const earned = randomRange(bot.config.economy.workMin, bot.config.economy.workMax);
    await db.query('UPDATE users SET balance = balance + ? WHERE user_id = ?', [earned, interaction.user.id]);
    await interaction.editReply(`You worked and earned ${bot.config.economy.currency}${earned}!`);
  }
};
