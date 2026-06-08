const { SlashCommandBuilder, EmbedBuilder, Colors } = require('discord.js');
const Command = require('../../structures/Command');
const db = require('../../database/connection');
const { sendLog, isStaff } = require('../../handlers/ticketHandler');

module.exports = class ClaimCommand extends Command {
  constructor(bot) {
    super(bot);
    this.name = 'claim';
    this.description = 'Claim a ticket for yourself';
    this.category = 'tickets';
    this.slashData = new SlashCommandBuilder()
      .setName(this.name)
      .setDescription(this.description);
  }

  async execute(bot, message, args) {
    const guildData = await db.getGuild(message.guild.id);
    if (!isStaff(message.member, guildData)) return message.reply('Only staff can claim tickets.');

    const ticket = await db.query('SELECT * FROM tickets WHERE channel_id = ? AND guild_id = ?', [message.channel.id, message.guild.id]);
    if (ticket.length === 0) return message.reply('This is not a ticket channel.');
    if (ticket[0].claimed_by) return message.reply('This ticket is already claimed.');

    await db.query('UPDATE tickets SET claimed_by = ? WHERE channel_id = ?', [message.author.id, message.channel.id]);

    const embed = new EmbedBuilder()
      .setColor(Colors.Yellow)
      .setDescription(`🙋 **${message.author}** claimed this ticket.`)
      .setTimestamp();

    await message.channel.send({ embeds: [embed] });

    const logEmbed = new EmbedBuilder()
      .setColor(Colors.Yellow)
      .setTitle('Ticket Claimed')
      .addFields(
        { name: 'Ticket', value: ticket[0].ticket_id, inline: true },
        { name: 'Claimed by', value: `${message.author.tag} (${message.author.id})`, inline: true },
        { name: 'Channel', value: `${message.channel}`, inline: true }
      )
      .setTimestamp();

    await sendLog(message.guild, logEmbed);
  }

  async executeSlash(bot, interaction) {
    await interaction.deferReply();

    const guildData = await db.getGuild(interaction.guild.id);
    if (!isStaff(interaction.member, guildData)) return interaction.editReply('Only staff can claim tickets.');

    const ticket = await db.query('SELECT * FROM tickets WHERE channel_id = ? AND guild_id = ?', [interaction.channel.id, interaction.guild.id]);
    if (ticket.length === 0) return interaction.editReply('This is not a ticket channel.');
    if (ticket[0].claimed_by) {
      const claimer = await bot.users.fetch(ticket[0].claimed_by).catch(() => null);
      return interaction.editReply(`This ticket is already claimed by ${claimer ? claimer.tag : ticket[0].claimed_by}.`);
    }

    await db.query('UPDATE tickets SET claimed_by = ? WHERE channel_id = ?', [interaction.user.id, interaction.channel.id]);

    const embed = new EmbedBuilder()
      .setColor(Colors.Yellow)
      .setDescription(`🙋 **${interaction.user}** claimed this ticket.`)
      .setTimestamp();

    await interaction.editReply({ embeds: [embed] });

    const logEmbed = new EmbedBuilder()
      .setColor(Colors.Yellow)
      .setTitle('Ticket Claimed')
      .addFields(
        { name: 'Ticket', value: ticket[0].ticket_id, inline: true },
        { name: 'Claimed by', value: `${interaction.user.tag} (${interaction.user.id})`, inline: true },
        { name: 'Channel', value: `${interaction.channel}`, inline: true }
      )
      .setTimestamp();

    await sendLog(interaction.guild, logEmbed);
  }
};
