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
    if (!message.member.voice.channel) return message.reply('You need to be in a voice channel.');
    try {
      await bot.lavalink.stop(message.guild.id);
      await bot.lavalink.leaveVoiceChannel(message.guild.id);
      message.reply('Playback stopped and queue cleared.');
    } catch (err) {
      message.reply(`Error: ${err.message}`);
    }
  }

  async executeSlash(bot, interaction) {
    if (!interaction.member.voice.channel) return interaction.reply({ content: 'You need to be in a voice channel.', ephemeral: true });
    try {
      await bot.lavalink.stop(interaction.guild.id);
      await bot.lavalink.leaveVoiceChannel(interaction.guild.id);
      interaction.reply('Playback stopped and queue cleared.');
    } catch (err) {
      interaction.reply(`Error: ${err.message}`);
    }
  }
};
