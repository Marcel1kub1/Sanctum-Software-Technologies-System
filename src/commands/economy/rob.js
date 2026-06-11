const { SlashCommandBuilder } = require('discord.js');
const Command = require('../../structures/Command');
const db = require('../../database/connection');

const cooldowns = new Map();

module.exports = class RobCommand extends Command {
  constructor(bot) {
    super(bot);
    this.name = 'rob';
    this.description = 'Attempt to rob another user';
    this.category = 'economy';
    this.slashData = new SlashCommandBuilder()
      .setName(this.name)
      .setDescription(this.description)
      .addUserOption(opt => opt.setName('user').setDescription('The user to rob').setRequired(true));
  }

  async execute(bot, message, args) {
    const cfg = await bot.guildConfig(message.guild.id);
    const target = message.mentions.users.first();
    if (!target) {
      await message.reply('Please mention a user to rob.');
      return;
    }
    if (target.id === message.author.id) {
      await message.reply("You can't rob yourself!");
      return;
    }
    if (target.bot) {
      await message.reply("You can't rob a bot!");
      return;
    }

    const cooldownKey = message.author.id;
    const now = Date.now();
    if (cooldowns.has(cooldownKey)) {
      const expires = cooldowns.get(cooldownKey);
      if (now < expires) {
        const remaining = Math.ceil((expires - now) / 60000);
        await message.reply(`You must wait ${remaining} minute(s) before robbing again.`);
        return;
      }
    }

    const targetData = await db.getUser(target.id);
    if (targetData.balance < 100) {
      await message.reply('That user does not have enough money to rob.');
      return;
    }

    const senderData = await db.getUser(message.author.id);
    const currency = cfg.economy_currency || bot.config.economy.currency;

    if (Math.random() < 0.3) {
      const stealPercent = Math.random() * (0.25 - 0.10) + 0.10;
      let stolenAmount = Math.floor(targetData.balance * stealPercent);
      if (stolenAmount > 500) stolenAmount = 500;

      await db.query('UPDATE users SET balance = balance + ? WHERE user_id = ?', [stolenAmount, message.author.id]);
      await db.query('UPDATE users SET balance = balance - ? WHERE user_id = ?', [stolenAmount, target.id]);

      cooldowns.set(cooldownKey, now + 300000);
      await message.reply(`You robbed ${target.username} and got away with ${currency}${stolenAmount}!`);
    } else {
      const fine = 50;
      const actualFine = Math.min(fine, senderData.balance);
      if (actualFine > 0) {
        await db.query('UPDATE users SET balance = balance - ? WHERE user_id = ?', [actualFine, message.author.id]);
        await db.query('UPDATE users SET balance = balance + ? WHERE user_id = ?', [actualFine, target.id]);
      }

      cooldowns.set(cooldownKey, now + 300000);
      await message.reply(`You failed to rob ${target.username} and paid a fine of ${currency}${actualFine}!`);
    }
  }

  async executeSlash(bot, interaction) {
    await interaction.deferReply();
    const cfg = await bot.guildConfig(interaction.guild.id);
    const target = interaction.options.getUser('user');

    if (target.id === interaction.user.id) {
      await interaction.editReply("You can't rob yourself!");
      return;
    }
    if (target.bot) {
      await interaction.editReply("You can't rob a bot!");
      return;
    }

    const cooldownKey = interaction.user.id;
    const now = Date.now();
    if (cooldowns.has(cooldownKey)) {
      const expires = cooldowns.get(cooldownKey);
      if (now < expires) {
        const remaining = Math.ceil((expires - now) / 60000);
        await interaction.editReply(`You must wait ${remaining} minute(s) before robbing again.`);
        return;
      }
    }

    const targetData = await db.getUser(target.id);
    if (targetData.balance < 100) {
      await interaction.editReply('That user does not have enough money to rob.');
      return;
    }

    const senderData = await db.getUser(interaction.user.id);
    const currency = cfg.economy_currency || bot.config.economy.currency;

    if (Math.random() < 0.3) {
      const stealPercent = Math.random() * (0.25 - 0.10) + 0.10;
      let stolenAmount = Math.floor(targetData.balance * stealPercent);
      if (stolenAmount > 500) stolenAmount = 500;

      await db.query('UPDATE users SET balance = balance + ? WHERE user_id = ?', [stolenAmount, interaction.user.id]);
      await db.query('UPDATE users SET balance = balance - ? WHERE user_id = ?', [stolenAmount, target.id]);

      cooldowns.set(cooldownKey, now + 300000);
      await interaction.editReply(`You robbed ${target.username} and got away with ${currency}${stolenAmount}!`);
    } else {
      const fine = 50;
      const actualFine = Math.min(fine, senderData.balance);
      if (actualFine > 0) {
        await db.query('UPDATE users SET balance = balance - ? WHERE user_id = ?', [actualFine, interaction.user.id]);
        await db.query('UPDATE users SET balance = balance + ? WHERE user_id = ?', [actualFine, target.id]);
      }

      cooldowns.set(cooldownKey, now + 300000);
      await interaction.editReply(`You failed to rob ${target.username} and paid a fine of ${currency}${actualFine}!`);
    }
  }
};
