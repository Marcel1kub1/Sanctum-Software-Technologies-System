const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, Colors, ChannelType } = require('discord.js');
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
    if (args.length < 3) {
      return message.reply({
        embeds: [new EmbedBuilder()
          .setColor(Colors.Red)
          .setTitle('Usage')
          .setDescription('`!ticket-setup <#panel_channel> <@support_role> <#category> [#log_channel] [ticket_limit]`')
        ]
      });
    }

    const panelChannel = message.mentions.channels.first() || message.guild.channels.cache.get(args[0]);
    const supportRole = message.mentions.roles.first() || message.guild.roles.cache.get(args[1]);
    const category = message.guild.channels.cache.get(args[2].replace(/[<#>]/g, ''));
    let logChannel = null;
    let ticketLimit = 5;

    const mentionChannels = message.mentions.channels;
    const mentionedArray = [...mentionChannels.values()];

    if (mentionedArray.length >= 2) {
      logChannel = mentionedArray[1];
    }

    const parsedLimit = parseInt(args[args.length - 1], 10);
    if (!isNaN(parsedLimit) && parsedLimit >= 1 && parsedLimit <= 20) {
      ticketLimit = parsedLimit;
    }

    if (!panelChannel || (panelChannel.type !== ChannelType.GuildText && panelChannel.type !== ChannelType.GuildAnnouncement)) {
      return message.reply('Invalid panel channel. Provide a valid text channel mention or ID.');
    }

    if (!supportRole) {
      return message.reply('Invalid support role. Provide a valid role mention or ID.');
    }

    if (!category || category.type !== ChannelType.GuildCategory) {
      return message.reply('Invalid category. Provide a valid category ID.');
    }

    if (logChannel && logChannel.type !== ChannelType.GuildText && logChannel.type !== ChannelType.GuildAnnouncement) {
      logChannel = null;
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
      message.guild.id
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

    await message.reply({ embeds: [resultEmbed] });
  }

  async executeSlash(bot, interaction) {
    await interaction.deferReply({ ephemeral: true });

    const panelChannel = interaction.options.getChannel('panel_channel');
    const supportRole = interaction.options.getRole('support_role');
    const category = interaction.options.getChannel('category');
    const logChannel = interaction.options.getChannel('log_channel');
    const ticketLimit = interaction.options.getInteger('ticket_limit') || 5;

    if (panelChannel.type !== ChannelType.GuildText && panelChannel.type !== ChannelType.GuildAnnouncement) {
      return interaction.editReply('Panel channel must be a text channel.');
    }

    if (category.type !== ChannelType.GuildCategory) {
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
