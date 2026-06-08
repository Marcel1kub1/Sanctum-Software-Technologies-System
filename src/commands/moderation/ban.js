const { SlashCommandBuilder } = require('discord.js');
const Command = require('../../structures/Command');

module.exports = class BanCommand extends Command {
  constructor(bot) {
    super(bot);
    this.name = 'ban';
    this.description = 'Ban a member from the server';
    this.category = 'moderation';
    this.permissions = ['BanMembers'];
    this.slashData = new SlashCommandBuilder()
      .setName(this.name)
      .setDescription(this.description)
      .addUserOption(opt => opt.setName('user').setDescription('The user to ban').setRequired(true))
      .addStringOption(opt => opt.setName('reason').setDescription('Reason for the ban').setRequired(false));
  }

  async execute(bot, message, args) {
    const member = message.mentions.members.first();
    if (!member) {
      await message.reply('Please mention a user to ban.');
      return;
    }
    const reason = args.slice(1).join(' ') || 'No reason provided';
    await member.ban({ reason });
    await message.reply(`Banned ${member.user.tag} | Reason: ${reason}`);
  }

  async executeSlash(bot, interaction) {
    const user = interaction.options.getUser('user');
    const reason = interaction.options.getString('reason') || 'No reason provided';
    const member = interaction.guild.members.cache.get(user.id);
    if (!member) {
      await interaction.reply({ content: 'User not found in this server.', ephemeral: true });
      return;
    }
    await interaction.deferReply();
    await member.ban({ reason });
    await interaction.editReply(`Banned ${user.tag} | Reason: ${reason}`);
  }
};
