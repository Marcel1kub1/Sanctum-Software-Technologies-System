const { SlashCommandBuilder } = require('discord.js');
const Command = require('../../structures/Command');

module.exports = class StopCommand extends Command {
  constructor(bot) {
    super(bot);
    this.name = 'stop';
    this.description = 'Stop playback and clear the queue';
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
      await bot.lavalink.stop(message.guild.id);
      await bot.lavalink.leaveVoiceChannel(message.guild.id);
      await message.reply('Playback stopped and queue cleared.');
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
      await bot.lavalink.stop(interaction.guild.id);
      await bot.lavalink.leaveVoiceChannel(interaction.guild.id);
      await interaction.editReply('Playback stopped and queue cleared.');
    } catch (err) {
      await interaction.editReply(`Error: ${err.message}`);
    }
  }
};
