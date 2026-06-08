const { SlashCommandBuilder, EmbedBuilder, Colors } = require('discord.js');
const Command = require('../../structures/Command');
const db = require('../../database/connection');
const { sendLog, isStaff } = require('../../handlers/ticketHandler');

module.exports = class CloseCommand extends Command {
  constructor(bot) {
    super(bot);
    this.name = 'close';
    this.description = 'Close the current ticket';
    this.category = 'tickets';
    this.slashData = new SlashCommandBuilder()
      .setName(this.name)
      .setDescription(this.description)
      .addStringOption(opt => opt.setName('reason').setDescription('Reason for closing').setRequired(false));
  }

  async execute(bot, message, args) {
    const guildData = await db.getGuild(message.guild.id);
    if (!isStaff(message.member, guildData)) return message.reply('Only staff can close tickets.');

    const ticket = await db.query('SELECT * FROM tickets WHERE channel_id = ? AND guild_id = ?', [message.channel.id, message.guild.id]);
    if (ticket.length === 0) return message.reply('This is not a ticket channel.');
    if (ticket[0].status === 'closed') return message.reply('This ticket is already closed.');

    await db.query('UPDATE tickets SET status = ?, closed_at = NOW() WHERE channel_id = ?', ['closed', message.channel.id]);
    await message.channel.send('🔒 Ticket closed. Use `/reopen` to reopen or click Delete to remove.');
    await message.channel.permissionOverwrites.edit(ticket[0].creator_id, { ViewChannel: false }).catch(() => {});

    const logEmbed = new EmbedBuilder()
      .setColor(Colors.Orange)
      .setTitle('Ticket Closed')
      .addFields(
        { name: 'Ticket', value: ticket[0].ticket_id, inline: true },
        { name: 'Closed by', value: `${message.author.tag} (${message.author.id})`, inline: true },
        { name: 'Channel', value: `${message.channel}`, inline: true }
      )
      .setTimestamp();

    await sendLog(message.guild, logEmbed);
  }

  async executeSlash(bot, interaction) {
    await interaction.deferReply();

    const guildData = await db.getGuild(interaction.guild.id);
    if (!isStaff(interaction.member, guildData)) return interaction.editReply('Only staff can close tickets.');

    const reason = interaction.options.getString('reason') || 'No reason provided';

    const ticket = await db.query('SELECT * FROM tickets WHERE channel_id = ? AND guild_id = ?', [interaction.channel.id, interaction.guild.id]);
    if (ticket.length === 0) return interaction.editReply('This is not a ticket channel.');
    if (ticket[0].status === 'closed') return interaction.editReply('This ticket is already closed.');

    await db.query('UPDATE tickets SET status = ?, closed_at = NOW() WHERE channel_id = ?', ['closed', interaction.channel.id]);

    const closeEmbed = new EmbedBuilder()
      .setColor(Colors.Orange)
      .setDescription(`🔒 Ticket closed by **${interaction.user}**\n**Reason:** ${reason}\nUse \`/reopen\` to reopen.`)
      .setTimestamp();

    await interaction.editReply({ embeds: [closeEmbed] });
    await interaction.channel.permissionOverwrites.edit(ticket[0].creator_id, { ViewChannel: false }).catch(() => {});

    const logEmbed = new EmbedBuilder()
      .setColor(Colors.Orange)
      .setTitle('Ticket Closed')
      .addFields(
        { name: 'Ticket', value: ticket[0].ticket_id, inline: true },
        { name: 'Closed by', value: `${interaction.user.tag} (${interaction.user.id})`, inline: true },
        { name: 'Reason', value: reason, inline: false },
        { name: 'Channel', value: `${interaction.channel}`, inline: true }
      )
      .setTimestamp();

    await sendLog(interaction.guild, logEmbed);
  }
};
