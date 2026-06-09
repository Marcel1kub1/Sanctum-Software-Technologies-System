const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const db = require('../database/connection');

async function sendPanel(bot, guildId, panel) {
  const guild = bot.guilds.cache.get(guildId);
  if (!guild) return;

  const roles = await db.query('SELECT * FROM role_panel_roles WHERE panel_id = ? ORDER BY position ASC', [panel.id]);

  const embed = new EmbedBuilder()
    .setColor(panel.color || 0x5865F2)
    .setTitle(panel.title || 'Role Selection')
    .setDescription(panel.description || 'Click a button to toggle a role.');

  const rows = [];
  let row = new ActionRowBuilder();
  for (let i = 0; i < roles.length; i++) {
    const r = roles[i];
    const label = r.label || guild.roles.cache.get(r.role_id)?.name || 'Unknown';
    const btn = new ButtonBuilder()
      .setCustomId(`role_panel_${panel.id}_${r.id}`)
      .setLabel(label)
      .setStyle(ButtonStyle.Primary);
    if (r.emoji) btn.setEmoji(r.emoji);
    row.addComponents(btn);
    if ((i + 1) % 5 === 0) {
      rows.push(row);
      row = new ActionRowBuilder();
    }
  }
  if (row.components.length > 0) rows.push(row);

  const channel = guild.channels.cache.get(panel.channel_id);
  if (!channel) return;

  if (panel.message_id) {
    try {
      const msg = await channel.messages.fetch(panel.message_id);
      await msg.edit({ embeds: [embed], components: rows });
      return;
    } catch {}
  }

  const msg = await channel.send({ embeds: [embed], components: rows });
  await db.query('UPDATE role_panels SET message_id = ? WHERE id = ?', [msg.id, panel.id]);
}

async function handleRoleButton(bot, interaction) {
  const customId = interaction.customId;
  if (!customId.startsWith('role_panel_')) return;

  const parts = customId.split('_');
  const panelId = parseInt(parts[2]);
  const roleId = parseInt(parts[3]);

  const panel = (await db.query('SELECT * FROM role_panels WHERE id = ? AND guild_id = ?', [panelId, interaction.guild.id]))[0];
  if (!panel) {
    await interaction.reply({ content: 'This panel no longer exists.', ephemeral: true });
    return;
  }

  const roleData = (await db.query('SELECT * FROM role_panel_roles WHERE id = ? AND panel_id = ?', [roleId, panelId]))[0];
  if (!roleData) {
    await interaction.reply({ content: 'This role no longer exists in the panel.', ephemeral: true });
    return;
  }

  const role = interaction.guild.roles.cache.get(roleData.role_id);
  if (!role) {
    await interaction.reply({ content: 'The role for this button no longer exists.', ephemeral: true });
    return;
  }

  const member = interaction.member;

  if (member.roles.cache.has(role.id)) {
    await member.roles.remove(role.id);
    await interaction.reply({ content: `Removed role: ${role.name}`, ephemeral: true });
  } else {
    if (panel.max_roles > 0) {
      const assigned = panel.max_roles === 1
        ? member.roles.cache.filter(r => r.id !== interaction.guild.id)
        : member.roles.cache.filter(r => roleData.role_id.includes(r.id));
      if (panel.max_roles === 1 && assigned.size > 0) {
        await interaction.reply({ content: `You can only have one role. Remove your current role first.`, ephemeral: true });
        return;
      }
    }
    await member.roles.add(role.id);
    await interaction.reply({ content: `Added role: ${role.name}`, ephemeral: true });
  }
}

module.exports = { handleRoleButton, sendPanel };
