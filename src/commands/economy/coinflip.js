const { SlashCommandBuilder } = require('discord.js');
const Command = require('../../structures/Command');
const db = require('../../database/connection');

async function ensureEconomyUser(userId) {
  const rows = await db.query('SELECT * FROM economy WHERE user_id = ?', [userId]);
  if (rows.length === 0) {
    await db.query('INSERT INTO economy (user_id, balance) VALUES (?, 0)', [userId]);
    return { user_id: userId, balance: 0, last_weekly_time: 0 };
  }
  return rows[0];
}

module.exports = class CoinflipCommand extends Command {
  constructor(bot) {
    super(bot);
    this.name = 'coinflip';
    this.description = 'Flip a coin and bet on the outcome';
    this.category = 'economy';
    this.slashData = new SlashCommandBuilder()
      .setName(this.name)
      .setDescription(this.description)
      .addIntegerOption(opt => opt.setName('bet').setDescription('Amount to bet').setRequired(true).setMinValue(1))
      .addStringOption(opt => opt.setName('side').setDescription('Heads or tails').setRequired(true).addChoices(
        { name: 'Heads', value: 'heads' },
        { name: 'Tails', value: 'tails' }
      ));
  }

  async execute(bot, message, args) {
    const cfg = await bot.guildConfig(message.guild.id);
    const bet = parseInt(args[0]);
    const choice = args[1] ? args[1].toLowerCase() : null;

    if (!bet || bet < 1 || isNaN(bet)) {
      await message.reply('Please enter a valid bet amount (minimum 1).');
      return;
    }
    if (!choice || !['heads', 'tails'].includes(choice)) {
      await message.reply('Please choose `heads` or `tails`.');
      return;
    }

    const userData = await ensureEconomyUser(message.author.id);
    if (userData.balance < bet) {
      await message.reply("You don't have enough money to place that bet.");
      return;
    }

    const result = Math.random() < 0.5 ? 'heads' : 'tails';
    const currency = cfg.economy_currency || bot.config.economy.currency;

    if (result === choice) {
      const winnings = bet * 2;
      await db.query('UPDATE economy SET balance = balance + ? WHERE user_id = ?', [bet, message.author.id]);
      await message.reply(`It landed on **${result}**! You won ${currency}${bet}!`);
    } else {
      await db.query('UPDATE economy SET balance = balance - ? WHERE user_id = ?', [bet, message.author.id]);
      await message.reply(`It landed on **${result}**! You lost ${currency}${bet}. Better luck next time!`);
    }
  }

  async executeSlash(bot, interaction) {
    await interaction.deferReply();
    const cfg = await bot.guildConfig(interaction.guild.id);
    const bet = interaction.options.getInteger('bet');
    const choice = interaction.options.getString('side').toLowerCase();

    const userData = await ensureEconomyUser(interaction.user.id);
    if (userData.balance < bet) {
      await interaction.editReply("You don't have enough money to place that bet.");
      return;
    }

    const result = Math.random() < 0.5 ? 'heads' : 'tails';
    const currency = cfg.economy_currency || bot.config.economy.currency;

    if (result === choice) {
      await db.query('UPDATE economy SET balance = balance + ? WHERE user_id = ?', [bet, interaction.user.id]);
      await interaction.editReply(`It landed on **${result}**! You won ${currency}${bet}!`);
    } else {
      await db.query('UPDATE economy SET balance = balance - ? WHERE user_id = ?', [bet, interaction.user.id]);
      await interaction.editReply(`It landed on **${result}**! You lost ${currency}${bet}. Better luck next time!`);
    }
  }
};
