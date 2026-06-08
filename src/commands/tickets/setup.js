const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, Colors } = require('discord.js');
const Command = require('../../structures/Command');
const db = require('../../database/connection');

module.exports = class TicketSetupCommand extends Command {
  constructor(bot) {
    super(bot);
    this.name = 'ticket-setup';
    this.description = 'Configure the ticket system';
    this.category = 'tickets';
    this.permissions = ['Administrator'];
    this.slashData = new SlashCommandBuilder()
      .setName(this.name)
      .setDescription(this.description)
      .addChannelOption(opt => opt.setName('panel_channel').setDescription('Channel for the ticket panel').setRequired(true))
      .addRoleOption(opt => opt.setName('support_role').setDescription('Support role that can see/manage tickets').setRequired(true))
      .addChannelOption(opt => opt.setName('category').setDescription('Category for ticket channels').setRequired(true))
      .addChannelOption(opt => opt.setName('log_channel').setDescription('Channel for ticket logs (optional)').setRequired(false))
      .addIntegerOption(opt => opt.setName('ticket_limit').setDescription('Max open tickets per user (default 5)').setRequired(false).setMinValue(1).setMaxValue(20));
  }

  async execute(bot, message, args) {
    const embed = new EmbedBuilder()
      .setColor(Colors.Blue)
      .setTitle('Ticket Setup')
      .setDescription('Use `/ticket-setup` to configure the ticket system.');
    await message.reply({ embeds: [embed] });
  }

  async executeSlash(bot, interaction) {
    await interaction.deferReply({ ephemeral: true });

    const panelChannel = interaction.options.getChannel('panel_channel');
    const supportRole = interaction.options.getRole('support_role');
    const category = interaction.options.getChannel('category');
    const logChannel = interaction.options.getChannel('log_channel');
    const ticketLimit = interaction.options.getInteger('ticket_limit') || 5;

    if (panelChannel.type !== 0 && panelChannel.type !== 5) {
      return interaction.editReply('Panel channel must be a text channel.');
    }

    if (category.type !== 4) {
      return interaction.editReply('Category must be a channel category.');
    }

    await db.query(`UPDATE guilds SET
      ticket_panel_channel = ?,
      ticket_support_roles = ?,
      ticket_category = ?,
      ticket_log_channel = ?,
      ticket_limit = ?
      WHERE guild_id = ?`, [
      panelChannel.id,
      JSON.stringify([supportRole.id]),
      category.id,
      logChannel ? logChannel.id : null,
      ticketLimit,
      interaction.guild.id
    ]);

    const ticketEmbed = new EmbedBuilder()
      .setColor(Colors.Blue)
      .setTitle('🎫 Support Tickets')
      .setDescription('Click the button below to open a support ticket. Staff will assist you as soon as possible.')
      .addFields(
        { name: 'Ticket Limit', value: `${ticketLimit} open tickets per user`, inline: true },
        { name: 'Support Team', value: `${supportRole}`, inline: true }
      )
      .setFooter({ text: 'Sanctum Ticket System' })
      .setTimestamp();

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId('ticket_create').setLabel('Create Ticket').setStyle(ButtonStyle.Primary).setEmoji('🎫')
    );

    await panelChannel.send({ embeds: [ticketEmbed], components: [row] });

    const resultEmbed = new EmbedBuilder()
      .setColor(Colors.Green)
      .setTitle('✅ Ticket System Configured')
      .addFields(
        { name: 'Panel Channel', value: `${panelChannel}`, inline: true },
        { name: 'Support Role', value: `${supportRole}`, inline: true },
        { name: 'Category', value: `${category.name}`, inline: true },
        { name: 'Log Channel', value: logChannel ? `${logChannel}` : 'None', inline: true },
        { name: 'Ticket Limit', value: `${ticketLimit}`, inline: true }
      )
      .setTimestamp();

    await interaction.editReply({ embeds: [resultEmbed] });
  }
};
