const { SlashCommandBuilder, EmbedBuilder, Colors, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const Command = require('../../structures/Command');
const db = require('../../database/connection');
const { sendLog, generateTranscript } = require('../../handlers/ticketHandler');

module.exports = class DeleteCommand extends Command {
  constructor(bot) {
    super(bot);
    this.name = 'delete';
    this.description = 'Delete the current ticket channel';
    this.category = 'tickets';
    this.slashData = new SlashCommandBuilder()
      .setName(this.name)
      .setDescription(this.description);
  }

  async execute(bot, message, args) {
    const guildData = await db.getGuild(message.guild.id);
    const supportRoles = guildData.ticket_support_roles ? JSON.parse(guildData.ticket_support_roles) : [];
    const isStaff = message.member.permissions.has('Administrator') || message.member.roles.cache.some(r => supportRoles.includes(r.id));
    if (!isStaff) return message.reply('Only staff can delete tickets.');

    const ticket = await db.query('SELECT * FROM tickets WHERE channel_id = ? AND guild_id = ?', [message.channel.id, message.guild.id]);
    if (ticket.length === 0) return message.reply('This is not a ticket channel.');

    const t = ticket[0];
    const transcript = await generateTranscript(message.channel);
    const creator = await bot.users.fetch(t.creator_id).catch(() => null);
    const claimedBy = t.claimed_by ? await bot.users.fetch(t.claimed_by).catch(() => null) : null;

    const logEmbed = new EmbedBuilder()
      .setColor(Colors.Red)
      .setTitle('Ticket Deleted')
      .addFields(
        { name: 'Ticket', value: t.ticket_id, inline: true },
        { name: 'Creator', value: creator ? `${creator.tag} (${t.creator_id})` : t.creator_id, inline: true },
        { name: 'Subject', value: t.subject || 'None', inline: false },
        { name: 'Status', value: t.status, inline: true },
        { name: 'Claimed by', value: claimedBy ? claimedBy.tag : 'Nobody', inline: true },
        { name: 'Deleted by', value: `${message.author.tag} (${message.author.id})`, inline: true }
      )
      .setTimestamp();

    const logChannel = guildData.ticket_log_channel ? message.guild.channels.cache.get(guildData.ticket_log_channel) : null;
    if (logChannel) {
      const transcriptFile = Buffer.from(transcript, 'utf-8');
      await logChannel.send({
        embeds: [logEmbed],
        files: [{ attachment: transcriptFile, name: `transcript-${t.ticket_id}.txt` }]
      }).catch(() => {});
    }

    await message.channel.delete().catch(() => {});
  }

  async executeSlash(bot, interaction) {
    const guildData = await db.getGuild(interaction.guild.id);
    const supportRoles = guildData.ticket_support_roles ? JSON.parse(guildData.ticket_support_roles) : [];
    const isStaff = interaction.member.permissions.has('Administrator') || interaction.member.roles.cache.some(r => supportRoles.includes(r.id));
    if (!isStaff) return interaction.reply({ content: 'Only staff can delete tickets.', ephemeral: true });

    const ticket = await db.query('SELECT * FROM tickets WHERE channel_id = ? AND guild_id = ?', [interaction.channel.id, interaction.guild.id]);
    if (ticket.length === 0) return interaction.reply({ content: 'This is not a ticket channel.', ephemeral: true });

    const confirmRow = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId('ticket_confirm_delete').setLabel('Confirm Delete').setStyle(ButtonStyle.Danger).setEmoji('⚠️'),
      new ButtonBuilder().setCustomId('ticket_cancel_delete').setLabel('Cancel').setStyle(ButtonStyle.Secondary)
    );

    await interaction.reply({ content: 'Are you sure you want to delete this ticket channel and all its messages?', components: [confirmRow], ephemeral: true });
  }
};
