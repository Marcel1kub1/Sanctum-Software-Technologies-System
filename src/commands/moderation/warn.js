const { SlashCommandBuilder } = require('discord.js');
const Command = require('../../structures/Command');
const db = require('../../database/connection');

module.exports = class WarnCommand extends Command {
  constructor(bot) {
    super(bot);
    this.name = 'warn';
    this.description = 'Warn a member';
    this.category = 'moderation';
    this.permissions = ['ManageMessages'];
    this.slashData = new SlashCommandBuilder()
      .setName(this.name)
      .setDescription(this.description)
      .addUserOption(opt => opt.setName('user').setDescription('The user to warn').setRequired(true))
      .addStringOption(opt => opt.setName('reason').setDescription('Reason for the warning').setRequired(false));
  }

  async execute(bot, message, args) {
    const member = message.mentions.members.first();
    if (!member) {
      await message.reply('Please mention a user to warn.');
      return;
    }
    const reason = args.slice(1).join(' ') || 'No reason provided';
    await db.query('INSERT INTO warnings (user_id, guild_id, moderator_id, reason) VALUES (?, ?, ?, ?)',
      [member.id, message.guild.id, message.author.id, reason]);
    await db.query('INSERT INTO warnings_count (user_id, guild_id, count) VALUES (?, ?, 1) ON DUPLICATE KEY UPDATE count = count + 1',
      [member.id, message.guild.id]);
    await message.reply(`Warned ${member.user.tag} | Reason: ${reason}`);
  }

  async executeSlash(bot, interaction) {
    const user = interaction.options.getUser('user');
    const reason = interaction.options.getString('reason') || 'No reason provided';
    await interaction.deferReply();
    await db.query('INSERT INTO warnings (user_id, guild_id, moderator_id, reason) VALUES (?, ?, ?, ?)',
      [user.id, interaction.guild.id, interaction.user.id, reason]);
    await db.query('INSERT INTO warnings_count (user_id, guild_id, count) VALUES (?, ?, 1) ON DUPLICATE KEY UPDATE count = count + 1',
      [user.id, interaction.guild.id]);
    await interaction.editReply(`Warned ${user.tag} | Reason: ${reason}`);
  }
};
