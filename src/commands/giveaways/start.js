const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const Command = require('../../structures/Command');
const db = require('../../database/connection');
const { parseTime } = require('../../utils/functions');

module.exports = class GiveawayStartCommand extends Command {
  constructor(bot) {
    super(bot);
    this.name = 'giveaway';
    this.description = 'Start a giveaway';
    this.category = 'giveaways';
    this.permissions = ['ManageMessages'];
    this.slashData = new SlashCommandBuilder()
      .setName(this.name)
      .setDescription(this.description)
      .addStringOption(opt => opt.setName('prize').setDescription('The prize to give away').setRequired(true))
      .addStringOption(opt => opt.setName('duration').setDescription('Duration (e.g. 1h, 30m)').setRequired(true))
      .addIntegerOption(opt => opt.setName('winners').setDescription('Number of winners').setRequired(false).setMinValue(1).setMaxValue(20));
  }

  async execute(bot, message, args) {
    await message.reply('Giveaway system (use slash command)');
  }

  async executeSlash(bot, interaction) {
    const prize = interaction.options.getString('prize');
    const duration = interaction.options.getString('duration');
    const winners = interaction.options.getInteger('winners') || 1;
    const durationMs = parseTime(duration);
    if (!durationMs || durationMs < 10000) {
      await interaction.reply({ content: 'Invalid duration. Min 10 seconds.', ephemeral: true });
      return;
    }

    const endTime = Date.now() + durationMs;
    const embed = new EmbedBuilder()
      .setTitle(`🎉 ${prize}`)
      .setDescription(`React to enter!\nEnds: <t:${Math.floor(endTime / 1000)}:R>\nWinners: ${winners}`)
      .setColor(0x5865F2)
      .setFooter({ text: 'Sanctum Technologies Giveaways' });

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId('enter_giveaway').setLabel('🎉 Enter').setStyle(ButtonStyle.Success)
    );

    const msg = await interaction.reply({ embeds: [embed], components: [row], fetchReply: true });

    await db.query(
      'INSERT INTO giveaways (message_id, channel_id, guild_id, prize, winners, end_time, requirements, entrants) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [msg.id, interaction.channel.id, interaction.guild.id, prize, winners, endTime, JSON.stringify({}), JSON.stringify([])]
    );
  }
};
