const { SlashCommandBuilder } = require('discord.js');
const Command = require('../../structures/Command');

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
    if (!message.member.voice.channel) return message.reply('You need to be in a voice channel.');
    try {
      await bot.lavalink.pause(message.guild.id);
      message.reply('Playback paused.');
    } catch (err) {
      message.reply(`Error: ${err.message}`);
    }
  }

  async executeSlash(bot, interaction) {
    if (!interaction.member.voice.channel) return interaction.reply({ content: 'You need to be in a voice channel.', ephemeral: true });
    try {
      await bot.lavalink.pause(interaction.guild.id);
      interaction.reply('Playback paused.');
    } catch (err) {
      interaction.reply(`Error: ${err.message}`);
    }
  }
};
