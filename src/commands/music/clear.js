const { SlashCommandBuilder } = require('discord.js');
const Command = require('../../structures/Command');

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

  execute(bot, message) {
    if (!message.member.voice.channel) return message.reply('You need to be in a voice channel.');
    bot.lavalink.clearQueue(message.guild.id);
    message.reply('Queue cleared.');
  }

  executeSlash(bot, interaction) {
    if (!interaction.member.voice.channel) return interaction.reply({ content: 'You need to be in a voice channel.', ephemeral: true });
    bot.lavalink.clearQueue(interaction.guild.id);
    interaction.reply('Queue cleared.');
  }
};
