const { SlashCommandBuilder } = require('discord.js');
const Command = require('../../structures/Command');
const { sendOrUpdatePanel } = require('../../handlers/musicPanelHandler');

module.exports = class ClearCommand extends Command {
  constructor(bot) {
    super(bot);
    this.name = 'clear';
    this.description = 'Clear all upcoming tracks from the queue';
    this.category = 'music';
    this.slashData = new SlashCommandBuilder()
      .setName(this.name)
      .setDescription(this.description);
  }

  async execute(bot, message) {
    if (!message.member.voice.channel) {
      await message.reply('You need to be in a voice channel.');
      return;
    }
    bot.lavalink.clearQueue(message.guild.id);
    await sendOrUpdatePanel(bot, message.guild.id);
    await message.reply('Queue cleared.');
  }

  async executeSlash(bot, interaction) {
    if (!interaction.member.voice.channel) {
      await interaction.reply({ content: 'You need to be in a voice channel.', ephemeral: true });
      return;
    }
    bot.lavalink.clearQueue(interaction.guild.id);
    await sendOrUpdatePanel(bot, interaction.guild.id);
    await interaction.reply('Queue cleared.');
  }
};
