const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionFlagsBits, ChannelType, ModalBuilder, TextInputBuilder, TextInputStyle, Colors } = require('discord.js');
const db = require('../database/connection');

const TICKET_ID_LENGTH = 6;
const CHARSET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';

function generateTicketId() {
  let id = '';
  for (let i = 0; i < TICKET_ID_LENGTH; i++) {
    id += CHARSET[Math.floor(Math.random() * CHARSET.length)];
  }
  return id;
}

function formatTimestamp(date) {
  return `<t:${Math.floor(date.getTime() / 1000)}:f>`;
}

function isStaff(member, guildData) {
  if (member.permissions.has(PermissionFlagsBits.Administrator)) return true;
  if (!guildData.ticket_support_roles) return false;
  const roles = JSON.parse(guildData.ticket_support_roles);
  return member.roles.cache.some(r => roles.includes(r.id));
}

async function getTicketLogChannel(guild) {
  const guildData = await db.getGuild(guild.id);
  if (!guildData.ticket_log_channel) return null;
  return guild.channels.cache.get(guildData.ticket_log_channel);
}

async function sendLog(guild, embed) {
  const logChannel = await getTicketLogChannel(guild);
  if (logChannel) await logChannel.send({ embeds: [embed] }).catch(() => {});
}

async function generateTranscript(channel) {
  const messages = [];
  let lastId;
  let fetched;
  while (true) {
    fetched = await channel.messages.fetch({ limit: 100, before: lastId }).catch(() => null);
    if (!fetched || fetched.size === 0) break;
    messages.push(...fetched.values());
    lastId = fetched.last().id;
    if (fetched.size < 100) break;
  }
  messages.reverse();

  const lines = messages.map(m => {
    const time = formatTimestamp(m.createdAt);
    const attachments = m.attachments.size > 0 ? ` [${m.attachments.map(a => a.url).join(', ')}]` : '';
    return `[${time}] ${m.author.tag} (${m.author.id}): ${m.content}${attachments}`;
  });

  return lines.join('\n') || 'No messages.';
}

const TICKET_TYPE_MAP = {
  general: 'General Support',
  technical: 'Technical Support',
  report: 'Report Issue',
  other: 'Other'
};

async function handleTicketCreateButton(bot, interaction, guildData, ticketTypeKey = 'general') {
  const ticketType = TICKET_TYPE_MAP[ticketTypeKey] || TICKET_TYPE_MAP.general;
  if (!guildData.ticket_category) {
    return interaction.reply({ content: 'Ticket system is not fully configured. No ticket category set.', ephemeral: true });
  }

  const limit = guildData.ticket_limit || 5;
  const openTickets = await db.query(
    'SELECT COUNT(*) as count FROM tickets WHERE guild_id = ? AND creator_id = ? AND status = ?',
    [interaction.guild.id, interaction.user.id, 'open']
  );
  if (openTickets[0].count >= limit) {
    return interaction.reply({ content: `You already have ${limit} open tickets. Close one before opening another.`, ephemeral: true });
  }

  const modal = new ModalBuilder()
    .setCustomId(`ticket_subject_modal_${ticketTypeKey}`)
    .setTitle(`Create a ${ticketType}`);

  const subjectInput = new TextInputBuilder()
    .setCustomId('ticket_subject')
    .setLabel('What do you need help with?')
    .setStyle(TextInputStyle.Short)
    .setPlaceholder('e.g., I need help with a server issue')
    .setRequired(true);

  modal.addComponents(new ActionRowBuilder().addComponents(subjectInput));
  await interaction.showModal(modal);
}

async function handleTicketSubjectModal(bot, interaction, guildData) {
  await interaction.deferReply({ ephemeral: true });
  const subject = interaction.fields.getTextInputValue('ticket_subject');
  const ticketTypeKey = interaction.customId.replace('ticket_subject_modal_', '') || 'general';
  const ticketType = TICKET_TYPE_MAP[ticketTypeKey] || TICKET_TYPE_MAP.general;
  const guild = interaction.guild;
  const ticketId = generateTicketId();
  const categoryId = guildData.ticket_category;
  const category = guild.channels.cache.get(categoryId);

  if (!category) {
    return interaction.editReply('Ticket category not found. Contact an admin.');
  }

  const supportRoles = guildData.ticket_support_roles ? JSON.parse(guildData.ticket_support_roles) : [];
  const permissionOverwrites = [
    {
      id: guild.id,
      deny: [PermissionFlagsBits.ViewChannel]
    },
    {
      id: interaction.user.id,
      allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory, PermissionFlagsBits.AttachFiles]
    }
  ];

  for (const roleId of supportRoles) {
    permissionOverwrites.push({
      id: roleId,
      allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory, PermissionFlagsBits.ManageMessages]
    });
  }

  const channel = await guild.channels.create({
    name: `ticket-${ticketId.toLowerCase()}`,
    type: ChannelType.GuildText,
    parent: categoryId,
    permissionOverwrites,
    topic: `Ticket ${ticketId} — ${interaction.user.tag} — ${ticketType}`
  });

  const storedSubject = `[${ticketType}] ${subject}`;
  await db.query(
    'INSERT INTO tickets (ticket_id, channel_id, guild_id, creator_id, subject, status) VALUES (?, ?, ?, ?, ?, ?)',
    [ticketId, channel.id, guild.id, interaction.user.id, storedSubject, 'open']
  );

  const welcomeEmbed = new EmbedBuilder()
    .setColor(Colors.Blue)
    .setTitle(`Ticket ${ticketId}`)
    .setDescription(`**Category:** ${ticketType}\n**Subject:** ${subject}\n**Created by:** ${interaction.user}\n**Created:** ${formatTimestamp(new Date())}`)
    .addFields({ name: 'Creator', value: `${interaction.user.tag} (${interaction.user.id})`, inline: true })
    .setFooter({ text: 'Staff: click Claim to handle this ticket' });

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId('ticket_claim').setLabel('Claim').setStyle(ButtonStyle.Primary).setEmoji('🙋'),
    new ButtonBuilder().setCustomId('ticket_close').setLabel('Close').setStyle(ButtonStyle.Secondary).setEmoji('🔒'),
    new ButtonBuilder().setCustomId('ticket_delete').setLabel('Delete').setStyle(ButtonStyle.Danger).setEmoji('🗑️')
  );

  await channel.send({ content: `${interaction.user} | <@&${supportRoles.join('>, <@&')}>` });
  await channel.send({ embeds: [welcomeEmbed], components: [row] });

  await interaction.editReply({ content: `Ticket created: ${channel}` });

  const logEmbed = new EmbedBuilder()
    .setColor(Colors.Green)
    .setTitle('Ticket Created')
    .addFields(
      { name: 'Ticket', value: ticketId, inline: true },
      { name: 'Creator', value: `${interaction.user.tag} (${interaction.user.id})`, inline: true },
      { name: 'Category', value: ticketType, inline: true },
      { name: 'Subject', value: subject, inline: false },
      { name: 'Channel', value: `${channel}`, inline: true }
    )
    .setTimestamp();

  await sendLog(guild, logEmbed);
}

async function handleTicketClaim(bot, interaction, guildData) {
  const ticket = await db.query('SELECT * FROM tickets WHERE channel_id = ? AND guild_id = ?', [interaction.channel.id, interaction.guild.id]);
  if (ticket.length === 0) {
    return interaction.reply({ content: 'This is not a ticket channel.', ephemeral: true });
  }

  if (!isStaff(interaction.member, guildData)) {
    return interaction.reply({ content: 'Only staff can claim tickets.', ephemeral: true });
  }

  const t = ticket[0];
  if (t.claimed_by) {
    const claimer = await bot.users.fetch(t.claimed_by).catch(() => null);
    return interaction.reply({ content: `This ticket is already claimed by ${claimer ? claimer.tag : t.claimed_by}.`, ephemeral: true });
  }

  await db.query('UPDATE tickets SET claimed_by = ? WHERE channel_id = ?', [interaction.user.id, interaction.channel.id]);

  const claimEmbed = new EmbedBuilder()
    .setColor(Colors.Yellow)
    .setDescription(`🙋 **${interaction.user}** claimed this ticket.`)
    .setTimestamp();

  await interaction.reply({ embeds: [claimEmbed] });

  const logEmbed = new EmbedBuilder()
    .setColor(Colors.Yellow)
    .setTitle('Ticket Claimed')
    .addFields(
      { name: 'Ticket', value: t.ticket_id, inline: true },
      { name: 'Claimed by', value: `${interaction.user.tag} (${interaction.user.id})`, inline: true },
      { name: 'Channel', value: `${interaction.channel}`, inline: true }
    )
    .setTimestamp();

  await sendLog(interaction.guild, logEmbed);
}

async function handleTicketClose(bot, interaction, guildData) {
  const ticket = await db.query('SELECT * FROM tickets WHERE channel_id = ? AND guild_id = ?', [interaction.channel.id, interaction.guild.id]);
  if (ticket.length === 0) {
    return interaction.reply({ content: 'This is not a ticket channel.', ephemeral: true });
  }

  if (!isStaff(interaction.member, guildData)) {
    return interaction.reply({ content: 'Only staff can close tickets.', ephemeral: true });
  }

  const t = ticket[0];
  if (t.status === 'closed') {
    return interaction.reply({ content: 'This ticket is already closed.', ephemeral: true });
  }

  await db.query('UPDATE tickets SET status = ?, closed_at = NOW() WHERE channel_id = ?', ['closed', interaction.channel.id]);

  const closeEmbed = new EmbedBuilder()
    .setColor(Colors.Orange)
    .setDescription(`🔒 Ticket closed by **${interaction.user}**. Use \`/reopen\` to reopen or click Delete to remove.`)
    .setTimestamp();

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId('ticket_reopen').setLabel('Reopen').setStyle(ButtonStyle.Success).setEmoji('🔓'),
    new ButtonBuilder().setCustomId('ticket_delete').setLabel('Delete').setStyle(ButtonStyle.Danger).setEmoji('🗑️')
  );

  await interaction.reply({ embeds: [closeEmbed], components: [row] });

  await interaction.channel.permissionOverwrites.edit(t.creator_id, { ViewChannel: false }).catch(() => {});

  const creator = await bot.users.fetch(t.creator_id).catch(() => null);
  const logEmbed = new EmbedBuilder()
    .setColor(Colors.Orange)
    .setTitle('Ticket Closed')
    .addFields(
      { name: 'Ticket', value: t.ticket_id, inline: true },
      { name: 'Creator', value: creator ? `${creator.tag} (${t.creator_id})` : t.creator_id, inline: true },
      { name: 'Closed by', value: `${interaction.user.tag} (${interaction.user.id})`, inline: true },
      { name: 'Subject', value: t.subject || 'None', inline: false },
      { name: 'Channel', value: `${interaction.channel}`, inline: true }
    )
    .setTimestamp();

  await sendLog(interaction.guild, logEmbed);
}

async function handleTicketReopen(bot, interaction, guildData) {
  const ticket = await db.query('SELECT * FROM tickets WHERE channel_id = ? AND guild_id = ?', [interaction.channel.id, interaction.guild.id]);
  if (ticket.length === 0) {
    return interaction.reply({ content: 'This is not a ticket channel.', ephemeral: true });
  }

  if (!isStaff(interaction.member, guildData)) {
    return interaction.reply({ content: 'Only staff can reopen tickets.', ephemeral: true });
  }

  const t = ticket[0];
  if (t.status === 'open') {
    return interaction.reply({ content: 'This ticket is already open.', ephemeral: true });
  }

  await db.query('UPDATE tickets SET status = ?, closed_at = NULL, claimed_by = NULL WHERE channel_id = ?', ['open', interaction.channel.id]);

  await interaction.channel.permissionOverwrites.edit(t.creator_id, { ViewChannel: true }).catch(() => {});

  const reopenEmbed = new EmbedBuilder()
    .setColor(Colors.Green)
    .setDescription(`🔓 Ticket reopened by **${interaction.user}**.`)
    .setTimestamp();

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId('ticket_claim').setLabel('Claim').setStyle(ButtonStyle.Primary).setEmoji('🙋'),
    new ButtonBuilder().setCustomId('ticket_close').setLabel('Close').setStyle(ButtonStyle.Secondary).setEmoji('🔒'),
    new ButtonBuilder().setCustomId('ticket_delete').setLabel('Delete').setStyle(ButtonStyle.Danger).setEmoji('🗑️')
  );

  await interaction.reply({ embeds: [reopenEmbed], components: [row] });

  const logEmbed = new EmbedBuilder()
    .setColor(Colors.Green)
    .setTitle('Ticket Reopened')
    .addFields(
      { name: 'Ticket', value: t.ticket_id, inline: true },
      { name: 'Reopened by', value: `${interaction.user.tag} (${interaction.user.id})`, inline: true },
      { name: 'Channel', value: `${interaction.channel}`, inline: true }
    )
    .setTimestamp();

  await sendLog(interaction.guild, logEmbed);
}

async function handleTicketDelete(bot, interaction, guildData) {
  const ticket = await db.query('SELECT * FROM tickets WHERE channel_id = ? AND guild_id = ?', [interaction.channel.id, interaction.guild.id]);
  if (ticket.length === 0) {
    return interaction.reply({ content: 'This is not a ticket channel.', ephemeral: true });
  }

  if (!isStaff(interaction.member, guildData)) {
    return interaction.reply({ content: 'Only staff can delete tickets.', ephemeral: true });
  }

  const confirmRow = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId('ticket_confirm_delete').setLabel('Confirm Delete').setStyle(ButtonStyle.Danger).setEmoji('⚠️'),
    new ButtonBuilder().setCustomId('ticket_cancel_delete').setLabel('Cancel').setStyle(ButtonStyle.Secondary)
  );

  await interaction.reply({ content: 'Are you sure you want to delete this ticket channel and all its messages?', components: [confirmRow], ephemeral: true });
}

async function handleTicketConfirmDelete(bot, interaction, guildData) {
  const ticket = await db.query('SELECT * FROM tickets WHERE channel_id = ? AND guild_id = ?', [interaction.channel.id, interaction.guild.id]);
  if (ticket.length === 0) {
    return interaction.reply({ content: 'This is not a ticket channel.', ephemeral: true });
  }

  if (!isStaff(interaction.member, guildData)) {
    return interaction.reply({ content: 'Only staff can delete tickets.', ephemeral: true });
  }

  await interaction.deferReply({ ephemeral: true });
  const t = ticket[0];

  const transcript = await generateTranscript(interaction.channel);
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
      { name: 'Deleted by', value: `${interaction.user.tag} (${interaction.user.id})`, inline: true }
    )
    .setTimestamp();

  const logChannel = await getTicketLogChannel(interaction.guild);
  if (logChannel) {
    const transcriptFile = Buffer.from(transcript, 'utf-8');
    await logChannel.send({
      embeds: [logEmbed],
      files: [{ attachment: transcriptFile, name: `transcript-${t.ticket_id}.txt` }]
    }).catch(() => {});
  }

  await interaction.editReply('Deleting ticket channel...');
  await interaction.channel.delete().catch(() => {});
}

async function handleTicketInteraction(bot, interaction) {
  if (interaction.isButton() || interaction.isModalSubmit()) {
    const guildData = await db.getGuild(interaction.guild.id);

    const customId = interaction.customId;

    switch (customId) {
      case 'ticket_create':
        return handleTicketCreateButton(bot, interaction, guildData, 'general');
      case 'ticket_subject_modal':
      case 'ticket_subject_modal_general':
      case 'ticket_subject_modal_technical':
      case 'ticket_subject_modal_report':
      case 'ticket_subject_modal_other':
        return handleTicketSubjectModal(bot, interaction, guildData);
      case 'ticket_claim':
        return handleTicketClaim(bot, interaction, guildData);
      case 'ticket_close':
        return handleTicketClose(bot, interaction, guildData);
      case 'ticket_reopen':
        return handleTicketReopen(bot, interaction, guildData);
      case 'ticket_delete':
        return handleTicketDelete(bot, interaction, guildData);
      case 'ticket_confirm_delete':
        return handleTicketConfirmDelete(bot, interaction, guildData);
      case 'ticket_cancel_delete':
        return interaction.update({ content: 'Deletion cancelled.', components: [], ephemeral: true });
      default:
        if (typeof customId === 'string' && customId.startsWith('ticket_panel_')) {
          const ticketTypeKey = customId.substring('ticket_panel_'.length);
          return handleTicketCreateButton(bot, interaction, guildData, ticketTypeKey);
        }
        break;
    }
  }
}

module.exports = { handleTicketInteraction, isStaff, generateTicketId, generateTranscript, sendLog };
