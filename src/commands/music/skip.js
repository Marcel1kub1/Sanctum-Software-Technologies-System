const { SlashCommandBuilder } = require('discord.js');
const Command = require('../../structures/Command');

module.exports = class SkipCommand extends Command {
  constructor(bot) {
    super(bot);
    this.name = 'skip';
    this.description = 'Skip the current track';
    this.category = 'music';
    this.slashData = new SlashCommandBuilder()
      .setName(this.name)
      .setDescription(this.description);
  }

  async execute(bot, message) {
    if (!message.member.voice.channel) return message.reply('You need to be in a voice channel.');
    try {
      const next = await bot.lavalink.skip(message.guild.id);
      if (next) {
        message.reply(`Skipped. Now playing: **${next.info.title}**`);
      } else {
        message.reply('Skipped. Queue is now empty.');
      }
    } catch (err) {
      message.reply(`Error: ${err.message}`);
    }
  }

  async executeSlash(bot, interaction) {
    if (!interaction.member.voice.channel) return interaction.reply({ content: 'You need to be in a voice channel.', ephemeral: true });
    try {
      const next = await bot.lavalink.skip(interaction.guild.id);
      if (next) {
        interaction.reply(`Skipped. Now playing: **${next.info.title}**`);
      } else {
        interaction.reply('Skipped. Queue is now empty.');
      }
    } catch (err) {
      interaction.reply(`Error: ${err.message}`);
    }
  }
};
