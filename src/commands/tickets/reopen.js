const { SlashCommandBuilder, EmbedBuilder, Colors } = require('discord.js');
const Command = require('../../structures/Command');
const db = require('../../database/connection');
const { sendLog } = require('../../handlers/ticketHandler');

module.exports = class ReopenCommand extends Command {
  constructor(bot) {
    super(bot);
    this.name = 'reopen';
    this.description = 'Reopen a closed ticket';
    this.category = 'tickets';
    this.slashData = new SlashCommandBuilder()
      .setName(this.name)
      .setDescription(this.description);
  }

  async execute(bot, message, args) {
    const guildData = await db.getGuild(message.guild.id);
    const supportRoles = guildData.ticket_support_roles ? JSON.parse(guildData.ticket_support_roles) : [];
    const isStaff = message.member.permissions.has('Administrator') || message.member.roles.cache.some(r => supportRoles.includes(r.id));
    if (!isStaff) return message.reply('Only staff can reopen tickets.');

    const ticket = await db.query('SELECT * FROM tickets WHERE channel_id = ? AND guild_id = ?', [message.channel.id, message.guild.id]);
    if (ticket.length === 0) return message.reply('This is not a ticket channel.');
    if (ticket[0].status === 'open') return message.reply('This ticket is already open.');

    await db.query('UPDATE tickets SET status = ?, closed_at = NULL, claimed_by = NULL WHERE channel_id = ?', ['open', message.channel.id]);
    await message.channel.permissionOverwrites.edit(ticket[0].creator_id, { ViewChannel: true }).catch(() => {});

    const embed = new EmbedBuilder()
      .setColor(Colors.Green)
      .setDescription(`🔓 Ticket reopened by **${message.author}**.`)
      .setTimestamp();

    await message.channel.send({ embeds: [embed] });

    const logEmbed = new EmbedBuilder()
      .setColor(Colors.Green)
      .setTitle('Ticket Reopened')
      .addFields(
        { name: 'Ticket', value: ticket[0].ticket_id, inline: true },
        { name: 'Reopened by', value: `${message.author.tag} (${message.author.id})`, inline: true },
        { name: 'Channel', value: `${message.channel}`, inline: true }
      )
      .setTimestamp();

    await sendLog(message.guild, logEmbed);
  }

  async executeSlash(bot, interaction) {
    await interaction.deferReply();

    const guildData = await db.getGuild(interaction.guild.id);
    const supportRoles = guildData.ticket_support_roles ? JSON.parse(guildData.ticket_support_roles) : [];
    const isStaff = interaction.member.permissions.has('Administrator') || interaction.member.roles.cache.some(r => supportRoles.includes(r.id));
    if (!isStaff) return interaction.editReply('Only staff can reopen tickets.');

    const ticket = await db.query('SELECT * FROM tickets WHERE channel_id = ? AND guild_id = ?', [interaction.channel.id, interaction.guild.id]);
    if (ticket.length === 0) return interaction.editReply('This is not a ticket channel.');
    if (ticket[0].status === 'open') return interaction.editReply('This ticket is already open.');

    await db.query('UPDATE tickets SET status = ?, closed_at = NULL, claimed_by = NULL WHERE channel_id = ?', ['open', interaction.channel.id]);
    await interaction.channel.permissionOverwrites.edit(ticket[0].creator_id, { ViewChannel: true }).catch(() => {});

    const embed = new EmbedBuilder()
      .setColor(Colors.Green)
      .setDescription(`🔓 Ticket reopened by **${interaction.user}**.`)
      .setTimestamp();

    await interaction.editReply({ embeds: [embed] });

    const logEmbed = new EmbedBuilder()
      .setColor(Colors.Green)
      .setTitle('Ticket Reopened')
      .addFields(
        { name: 'Ticket', value: ticket[0].ticket_id, inline: true },
        { name: 'Reopened by', value: `${interaction.user.tag} (${interaction.user.id})`, inline: true },
        { name: 'Channel', value: `${interaction.channel}`, inline: true }
      )
      .setTimestamp();

    await sendLog(interaction.guild, logEmbed);
  }
};
