const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const Command = require('../../structures/Command');
const db = require('../../database/connection');

module.exports = class RankCommand extends Command {
  constructor(bot) {
    super(bot);
    this.name = 'rank';
    this.description = 'Check your or another user\'s level';
    this.category = 'leveling';
    this.slashData = new SlashCommandBuilder()
      .setName(this.name)
      .setDescription(this.description)
      .addUserOption(opt => opt.setName('user').setDescription('The user to check').setRequired(false));
  }

  async execute(bot, message, args) {
    const cfg = await bot.guildConfig(message.guild.id);
    const target = message.mentions.users.first() || message.author;
    const rows = await db.query('SELECT * FROM levels WHERE user_id = ? AND guild_id = ?', [target.id, message.guild.id]);
    const data = rows[0] || { xp: 0, level: 0 };
    const baseXP = cfg.leveling_base_xp || bot.config.leveling.baseXP;
    const xpMult = cfg.leveling_xp_multiplier || bot.config.leveling.xpMultiplier;
    const nextXP = Math.floor(baseXP * Math.pow(xpMult, data.level));
    const embed = new EmbedBuilder()
      .setTitle(`${target.username}'s Level`)
      .setColor(0x5865F2)
      .addFields(
        { name: 'Level', value: `${data.level}`, inline: true },
        { name: 'XP', value: `${data.xp} / ${nextXP}`, inline: true }
      );
    await message.reply({ embeds: [embed] });
  }

  async executeSlash(bot, interaction) {
    await interaction.deferReply();
    const cfg = await bot.guildConfig(interaction.guild.id);
    const target = interaction.options.getUser('user') || interaction.user;
    const rows = await db.query('SELECT * FROM levels WHERE user_id = ? AND guild_id = ?', [target.id, interaction.guild.id]);
    const data = rows[0] || { xp: 0, level: 0 };
    const baseXP = cfg.leveling_base_xp || bot.config.leveling.baseXP;
    const xpMult = cfg.leveling_xp_multiplier || bot.config.leveling.xpMultiplier;
    const nextXP = Math.floor(baseXP * Math.pow(xpMult, data.level));
    const embed = new EmbedBuilder()
      .setTitle(`${target.username}'s Level`)
      .setColor(0x5865F2)
      .addFields(
        { name: 'Level', value: `${data.level}`, inline: true },
        { name: 'XP', value: `${data.xp} / ${nextXP}`, inline: true }
      );
    await interaction.editReply({ embeds: [embed] });
  }
};
