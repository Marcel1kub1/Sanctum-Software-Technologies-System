const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits, ChannelType } = require('discord.js');
const Command = require('../../structures/Command');
const db = require('../../database/connection');
const { sendPanel } = require('../../handlers/rolePanelHandler');

function parseRoleIdsFromText(text) {
  const ids = [];
  const mentionRegex = /<@&(\d+)>/g;
  let match;
  while (match = mentionRegex.exec(text)) {
    ids.push(match[1]);
  }
  if (ids.length > 0) return ids;
  for (const token of text.split(/\s+/)) {
    const clean = token.replace(/[<@&>]/g, '');
    if (/^\d{17,19}$/.test(clean)) ids.push(clean);
  }
  return ids;
}

module.exports = class RolePanelCommand extends Command {
  constructor(bot) {
    super(bot);
    this.name = 'panel';
    this.description = 'Manage role selection panels';
    this.category = 'roles';
    this.permissions = ['Administrator'];
    this.slashData = new SlashCommandBuilder()
      .setName(this.name)
      .setDescription(this.description)
      .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
      .addSubcommand(sub => sub
        .setName('create')
        .setDescription('Create a new role panel')
        .addStringOption(opt => opt.setName('title').setDescription('Panel title').setRequired(true))
        .addChannelOption(opt => opt.setName('channel').setDescription('Channel to send the panel to').setRequired(true))
        .addStringOption(opt => opt.setName('description').setDescription('Panel description').setRequired(false))
      )
      .addSubcommand(sub => sub
        .setName('addrole')
        .setDescription('Add one or more roles to a panel')
        .addIntegerOption(opt => opt.setName('panel').setDescription('Panel ID').setRequired(true))
        .addRoleOption(opt => opt.setName('role').setDescription('Single role to add').setRequired(false))
        .addStringOption(opt => opt.setName('roles').setDescription('Multiple role mentions or IDs separated by spaces').setRequired(false))
        .addStringOption(opt => opt.setName('label').setDescription('Button label for all added roles').setRequired(false))
        .addStringOption(opt => opt.setName('emoji').setDescription('Button emoji for all added roles').setRequired(false))
      )
      .addSubcommand(sub => sub
        .setName('removerole')
        .setDescription('Remove a role from a panel')
        .addIntegerOption(opt => opt.setName('panel').setDescription('Panel ID').setRequired(true))
        .addIntegerOption(opt => opt.setName('entry').setDescription('Entry ID (use /panel list)').setRequired(true))
      )
      .addSubcommand(sub => sub
        .setName('send')
        .setDescription('Send/refresh a panel in its channel')
        .addIntegerOption(opt => opt.setName('panel').setDescription('Panel ID').setRequired(true))
      )
      .addSubcommand(sub => sub
        .setName('list')
        .setDescription('List all role panels')
      )
      .addSubcommand(sub => sub
        .setName('delete')
        .setDescription('Delete a role panel')
        .addIntegerOption(opt => opt.setName('panel').setDescription('Panel ID').setRequired(true))
      )
      .addSubcommand(sub => sub
        .setName('setmax')
        .setDescription('Set max roles a user can have from this panel (0 = unlimited)')
        .addIntegerOption(opt => opt.setName('panel').setDescription('Panel ID').setRequired(true))
        .addIntegerOption(opt => opt.setName('limit').setDescription('Max roles (0 = unlimited)').setRequired(true).setMinValue(0))
      );
  }

  async execute(bot, message, args) {
    if (!args.length) {
      return message.reply('Usage: !panel create|addrole|removerole|send|list|delete|setmax');
    }
    const sub = args[0].toLowerCase();
    if (sub === 'create') {
      const title = args.slice(1).join(' ');
      if (!title) return message.reply('Provide a panel title.');
      const result = await db.query('INSERT INTO role_panels (guild_id, title) VALUES (?, ?)', [message.guild.id, title]);
      await message.reply(`Panel created! ID: ${result.insertId}. Use \`!panel addrole ${result.insertId} @role1 @role2\` to add multiple roles.`);
    } else if (sub === 'list') {
      const panels = await db.query('SELECT * FROM role_panels WHERE guild_id = ?', [message.guild.id]);
      if (!panels.length) return message.reply('No role panels configured.');
      const embed = new EmbedBuilder()
        .setTitle('Role Panels')
        .setColor(0x5865F2)
        .setDescription(panels.map(p => `**ID ${p.id}** — ${p.title} (${p.roles_count || 0} roles)`).join('\n'));
      await message.reply({ embeds: [embed] });
    } else if (sub === 'delete') {
      const id = parseInt(args[1], 10);
      if (!id) return message.reply('Provide a panel ID.');
      await db.query('DELETE FROM role_panel_roles WHERE panel_id = ?', [id]);
      await db.query('DELETE FROM role_panels WHERE id = ? AND guild_id = ?', [id, message.guild.id]);
      await message.reply('Panel deleted.');
    } else if (sub === 'addrole') {
      const panelId = parseInt(args[1], 10);
      if (!panelId) return message.reply('Provide a valid panel ID.');

      const panel = (await db.query('SELECT * FROM role_panels WHERE id = ? AND guild_id = ?', [panelId, message.guild.id]))[0];
      if (!panel) return message.reply('Panel not found.');

      let roles = [...message.mentions.roles.values()];
      if (roles.length === 0) {
        const roleIds = args.slice(2)
          .map(arg => arg.replace(/[<@&>]/g, ''))
          .filter(id => /^\d{17,19}$/.test(id));
        roles = roleIds
          .map(id => message.guild.roles.cache.get(id))
          .filter(Boolean);
      }

      if (roles.length === 0) {
        return message.reply('Provide one or more role mentions or role IDs.');
      }

      const added = [];
      let count = (await db.query('SELECT COUNT(*) as c FROM role_panel_roles WHERE panel_id = ?', [panelId]))[0].c;
      for (const role of roles) {
        const exists = (await db.query('SELECT 1 FROM role_panel_roles WHERE panel_id = ? AND role_id = ?', [panelId, role.id]))[0];
        if (exists) continue;
        await db.query('INSERT INTO role_panel_roles (panel_id, guild_id, role_id, label, emoji, position) VALUES (?, ?, ?, ?, ?, ?)',
          [panelId, message.guild.id, role.id, role.name, '', count]);
        added.push(role.name);
        count += 1;
      }

      if (added.length === 0) {
        return message.reply('No new roles were added. They may already exist in this panel.');
      }

      await sendPanel(bot, message.guild.id, panel);
      await message.reply(`Added roles to panel #${panelId}: ${added.join(', ')}`);
    } else {
      await message.reply('Usage: !panel create|addrole|removerole|send|list|delete|setmax');
    }
  }

  async executeSlash(bot, interaction) {
    const sub = interaction.options.getSubcommand();

    if (sub === 'create') {
      const title = interaction.options.getString('title');
      const description = interaction.options.getString('description') || 'Click a button to toggle a role.';
      const channel = interaction.options.getChannel('channel');
      if (channel.type !== ChannelType.GuildText && channel.type !== ChannelType.GuildAnnouncement) {
        return interaction.reply({ content: 'Channel must be a text channel.', ephemeral: true });
      }
      const result = await db.query('INSERT INTO role_panels (guild_id, title, description, channel_id) VALUES (?, ?, ?, ?)',
        [interaction.guild.id, title, description, channel.id]);
      await interaction.reply({ content: `Panel created! ID: ${result.insertId}`, ephemeral: true });
      const panel = (await db.query('SELECT * FROM role_panels WHERE id = ?', [result.insertId]))[0];
      await sendPanel(bot, interaction.guild.id, panel);
    } else if (sub === 'addrole') {
      const panelId = interaction.options.getInteger('panel');
      const role = interaction.options.getRole('role');
      const rolesText = interaction.options.getString('roles') || '';
      const label = interaction.options.getString('label');
      const emoji = interaction.options.getString('emoji') || '';
      const panel = (await db.query('SELECT * FROM role_panels WHERE id = ? AND guild_id = ?', [panelId, interaction.guild.id]))[0];
      if (!panel) return interaction.reply({ content: 'Panel not found.', ephemeral: true });

      const ids = new Set();
      if (role) ids.add(role.id);
      if (rolesText) {
        parseRoleIdsFromText(rolesText).forEach(id => ids.add(id));
      }

      const roles = [...ids].map(id => interaction.guild.roles.cache.get(id)).filter(Boolean);
      if (!roles.length) {
        return interaction.reply({ content: 'Provide at least one valid role mention or role ID.', ephemeral: true });
      }

      let count = (await db.query('SELECT COUNT(*) as c FROM role_panel_roles WHERE panel_id = ?', [panelId]))[0].c;
      const added = [];
      for (const roleEntry of roles) {
        const exists = (await db.query('SELECT 1 FROM role_panel_roles WHERE panel_id = ? AND role_id = ?', [panelId, roleEntry.id]))[0];
        if (exists) continue;
        await db.query('INSERT INTO role_panel_roles (panel_id, guild_id, role_id, label, emoji, position) VALUES (?, ?, ?, ?, ?, ?)',
          [panelId, interaction.guild.id, roleEntry.id, label || roleEntry.name, emoji, count]);
        added.push(roleEntry.name);
        count += 1;
      }

      if (!added.length) {
        return interaction.reply({ content: 'No new roles were added. They may already exist in this panel.', ephemeral: true });
      }

      await interaction.reply({ content: `Added roles to panel #${panelId}: ${added.join(', ')}`, ephemeral: true });
      await sendPanel(bot, interaction.guild.id, panel);
    } else if (sub === 'removerole') {
      const panelId = interaction.options.getInteger('panel');
      const entryId = interaction.options.getInteger('entry');
      await db.query('DELETE FROM role_panel_roles WHERE id = ? AND panel_id = ?', [entryId, panelId]);
      await interaction.reply({ content: 'Role removed from panel.', ephemeral: true });
      const panel = (await db.query('SELECT * FROM role_panels WHERE id = ?', [panelId]))[0];
      if (panel) await sendPanel(bot, interaction.guild.id, panel);
    } else if (sub === 'send') {
      const panelId = interaction.options.getInteger('panel');
      const panel = (await db.query('SELECT * FROM role_panels WHERE id = ? AND guild_id = ?', [panelId, interaction.guild.id]))[0];
      if (!panel) return interaction.reply({ content: 'Panel not found.', ephemeral: true });
      await interaction.reply({ content: 'Sending panel...', ephemeral: true });
      await sendPanel(bot, interaction.guild.id, panel);
    } else if (sub === 'list') {
      const panels = await db.query(
        'SELECT p.*, (SELECT COUNT(*) FROM role_panel_roles WHERE panel_id = p.id) as roles_count FROM role_panels p WHERE p.guild_id = ?',
        [interaction.guild.id]);
      if (!panels.length) return interaction.reply({ content: 'No role panels configured.', ephemeral: true });
      const embed = new EmbedBuilder()
        .setTitle('Role Panels')
        .setColor(0x5865F2)
        .setDescription(panels.map(p =>
          `**ID ${p.id}** — ${p.title}\n└ ${p.roles_count} roles · ${p.channel_id ? `<#${p.channel_id}>` : 'No channel'}`
        ).join('\n'));
      await interaction.reply({ embeds: [embed], ephemeral: true });
    } else if (sub === 'delete') {
      const panelId = interaction.options.getInteger('panel');
      await db.query('DELETE FROM role_panel_roles WHERE panel_id = ?', [panelId]);
      await db.query('DELETE FROM role_panels WHERE id = ? AND guild_id = ?', [panelId, interaction.guild.id]);
      await interaction.reply({ content: 'Panel deleted.', ephemeral: true });
    } else if (sub === 'setmax') {
      const panelId = interaction.options.getInteger('panel');
      const limit = interaction.options.getInteger('limit');
      await db.query('UPDATE role_panels SET max_roles = ? WHERE id = ? AND guild_id = ?', [limit, panelId, interaction.guild.id]);
      await interaction.reply({ content: `Max roles set to ${limit} for panel #${panelId}.`, ephemeral: true });
    }
  }
};
