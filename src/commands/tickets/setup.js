const { SlashCommandBuilder, PermissionsBitField, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const Command = require('../../structures/Command');
const Guild = require('../../structures/models/Guild');

module.exports = class TicketSetupCommand extends Command {
  constructor(bot) {
    super(bot);
    this.name = 'ticket-setup';
    this.description = 'Set up the ticket system';
    this.category = 'tickets';
    this.permissions = ['Administrator'];
    this.slashData = new SlashCommandBuilder()
      .setName(this.name)
      .setDescription(this.description)
      .addChannelOption(opt => opt.setName('category').setDescription('The category for ticket channels').setRequired(true));
  }

  async execute(bot, message, args) {
    await message.reply('Ticket setup (placeholder)');
  }

  async executeSlash(bot, interaction) {
    const category = interaction.options.getChannel('category');
    await Guild.setTicketCategory(interaction.guild.id, category.id);
    const embed = new EmbedBuilder()
      .setTitle('Ticket System')
      .setDescription('Click the button below to create a ticket.')
      .setColor(0x5865F2);
    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId('create_ticket').setLabel('Create Ticket').setStyle(ButtonStyle.Primary).setEmoji('🎫')
    );
    await interaction.deferReply({ ephemeral: true });
    await interaction.channel.send({ embeds: [embed], components: [row] });
    await interaction.editReply({ content: `Ticket system set up in ${category.name} category.` });
  }
};
