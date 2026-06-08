const { SlashCommandBuilder } = require('discord.js');
const Command = require('../../structures/Command');

module.exports = class PreviousCommand extends Command {
  constructor(bot) {
    super(bot);
    this.name = 'previous';
    this.description = 'Play the previous track';
    this.category = 'music';
    this.slashData = new SlashCommandBuilder()
      .setName(this.name)
      .setDescription(this.description);
  }

  async execute(bot, message) {
    if (!message.member.voice.channel) return message.reply('You need to be in a voice channel.');
    try {
      const prev = await bot.lavalink.previous(message.guild.id);
      if (prev) {
        message.reply(`Now playing previous track: **${prev.info.title}**`);
      } else {
        message.reply('No previous track available.');
      }
    } catch (err) {
      message.reply(`Error: ${err.message}`);
    }
  }

  async executeSlash(bot, interaction) {
    if (!interaction.member.voice.channel) return interaction.reply({ content: 'You need to be in a voice channel.', ephemeral: true });
    try {
      const prev = await bot.lavalink.previous(interaction.guild.id);
      if (prev) {
        interaction.reply(`Now playing previous track: **${prev.info.title}**`);
      } else {
        interaction.reply('No previous track available.');
      }
    } catch (err) {
      interaction.reply(`Error: ${err.message}`);
    }
  }
};
