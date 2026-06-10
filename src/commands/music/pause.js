const { SlashCommandBuilder } = require('discord.js');
const Command = require('../../structures/Command');
const { sendOrUpdatePanel } = require('../../handlers/musicPanelHandler');

module.exports = class PauseCommand extends Command {
  constructor(bot) {
    super(bot);
    this.name = 'pause';
    this.description = 'Pause current playback';
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
    try {
      await bot.lavalink.pause(message.guild.id);
      await sendOrUpdatePanel(bot, message.guild.id);
      await message.reply('Playback paused.');
    } catch (err) {
      await message.reply(`Error: ${err.message}`);
    }
  }

  async executeSlash(bot, interaction) {
    if (!interaction.member.voice.channel) {
      await interaction.reply({ content: 'You need to be in a voice channel.', ephemeral: true });
      return;
    }
    await interaction.deferReply();
    try {
      await bot.lavalink.pause(interaction.guild.id);
      await sendOrUpdatePanel(bot, interaction.guild.id);
      await interaction.editReply('Playback paused.');
    } catch (err) {
      await interaction.editReply(`Error: ${err.message}`);
    }
  }
};
