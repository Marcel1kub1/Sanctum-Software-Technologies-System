const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const Command = require('../../structures/Command');
const User = require('../../structures/models/User');

module.exports = class LeaderboardCommand extends Command {
  constructor(bot) {
    super(bot);
    this.name = 'leaderboard';
    this.description = 'View the economy leaderboard';
    this.category = 'economy';
    this.slashData = new SlashCommandBuilder()
      .setName(this.name)
      .setDescription(this.description);
  }

  async execute(bot, message, args) {
    const top = await User.getLeaderboard(10);
    const embed = new EmbedBuilder()
      .setTitle('Economy Leaderboard')
      .setColor(0xFFD700)
      .setDescription(top.map((u, i) => `**${i + 1}.** <@${u.user_id}> - ${bot.config.economy.currency}${u.balance}`).join('\n') || 'No data');
    await message.reply({ embeds: [embed] });
  }

  async executeSlash(bot, interaction) {
    await interaction.deferReply();
    const top = await User.getLeaderboard(10);
    const embed = new EmbedBuilder()
      .setTitle('Economy Leaderboard')
      .setColor(0xFFD700)
      .setDescription(top.map((u, i) => `**${i + 1}.** <@${u.user_id}> - ${bot.config.economy.currency}${u.balance}`).join('\n') || 'No data');
    await interaction.editReply({ embeds: [embed] });
  }
};
