const { SlashCommandBuilder } = require('discord.js');
const Command = require('../../structures/Command');

module.exports = class KickCommand extends Command {
  constructor(bot) {
    super(bot);
    this.name = 'kick';
    this.description = 'Kick a member from the server';
    this.category = 'moderation';
    this.permissions = ['KickMembers'];
    this.slashData = new SlashCommandBuilder()
      .setName(this.name)
      .setDescription(this.description)
      .addUserOption(opt => opt.setName('user').setDescription('The user to kick').setRequired(true))
      .addStringOption(opt => opt.setName('reason').setDescription('Reason for the kick').setRequired(false));
  }

  async execute(bot, message, args) {
    const member = message.mentions.members.first();
    if (!member) {
      await message.reply('Please mention a user to kick.');
      return;
    }
    const reason = args.slice(1).join(' ') || 'No reason provided';
    await member.kick(reason);
    await message.reply(`Kicked ${member.user.tag} | Reason: ${reason}`);
  }

  async executeSlash(bot, interaction) {
    const user = interaction.options.getUser('user');
    const reason = interaction.options.getString('reason') || 'No reason provided';
    const member = interaction.guild.members.cache.get(user.id);
    if (!member) {
      await interaction.reply({ content: 'User not found.', ephemeral: true });
      return;
    }
    await interaction.deferReply();
    await member.kick(reason);
    await interaction.editReply(`Kicked ${user.tag} | Reason: ${reason}`);
  }
};
