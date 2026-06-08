const { SlashCommandBuilder } = require('discord.js');
const Command = require('../../structures/Command');
const Guild = require('../../structures/models/Guild');

module.exports = class SetWelcomeCommand extends Command {
  constructor(bot) {
    super(bot);
    this.name = 'setwelcome';
    this.description = 'Set the welcome message channel';
    this.category = 'welcome';
    this.permissions = ['Administrator'];
    this.slashData = new SlashCommandBuilder()
      .setName(this.name)
      .setDescription(this.description)
      .addChannelOption(opt => opt.setName('channel').setDescription('The welcome channel').setRequired(true));
  }

  async execute(bot, message, args) {
    const channel = message.mentions.channels.first();
    if (!channel) {
      await message.reply('Please mention a channel.');
      return;
    }
    await Guild.setWelcomeChannel(message.guild.id, channel.id);
    await message.reply(`Welcome messages will be sent to ${channel}.`);
  }

  async executeSlash(bot, interaction) {
    const channel = interaction.options.getChannel('channel');
    await interaction.deferReply();
    await Guild.setWelcomeChannel(interaction.guild.id, channel.id);
    await interaction.editReply(`Welcome messages will be sent to ${channel}.`);
  }
};
