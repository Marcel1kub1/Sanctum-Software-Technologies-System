const { SlashCommandBuilder } = require('discord.js');
const Command = require('../../structures/Command');

module.exports = class ResumeCommand extends Command {
  constructor(bot) {
    super(bot);
    this.name = 'resume';
    this.description = 'Resume paused playback';
    this.category = 'music';
    this.slashData = new SlashCommandBuilder()
      .setName(this.name)
      .setDescription(this.description);
  }

  async execute(bot, message) {
    if (!message.member.voice.channel) return message.reply('You need to be in a voice channel.');
    try {
      await bot.lavalink.resume(message.guild.id);
      message.reply('Playback resumed.');
    } catch (err) {
      message.reply(`Error: ${err.message}`);
    }
  }

  async executeSlash(bot, interaction) {
    if (!interaction.member.voice.channel) return interaction.reply({ content: 'You need to be in a voice channel.', ephemeral: true });
    try {
      await bot.lavalink.resume(interaction.guild.id);
      interaction.reply('Playback resumed.');
    } catch (err) {
      interaction.reply(`Error: ${err.message}`);
    }
  }
};
