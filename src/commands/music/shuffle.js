const { SlashCommandBuilder } = require('discord.js');
const Command = require('../../structures/Command');

module.exports = class ShuffleCommand extends Command {
  constructor(bot) {
    super(bot);
    this.name = 'shuffle';
    this.description = 'Toggle shuffle mode';
    this.category = 'music';
    this.slashData = new SlashCommandBuilder()
      .setName(this.name)
      .setDescription(this.description);
  }

  execute(bot, message) {
    if (!message.member.voice.channel) return message.reply('You need to be in a voice channel.');
    const status = bot.lavalink.getStatus(message.guild.id);
    bot.lavalink.setShuffle(message.guild.id, !status.shuffled);
    message.reply(`Shuffle ${status.shuffled ? 'disabled' : 'enabled'}.`);
  }

  executeSlash(bot, interaction) {
    if (!interaction.member.voice.channel) return interaction.reply({ content: 'You need to be in a voice channel.', ephemeral: true });
    const status = bot.lavalink.getStatus(interaction.guild.id);
    bot.lavalink.setShuffle(interaction.guild.id, !status.shuffled);
    interaction.reply(`Shuffle ${status.shuffled ? 'disabled' : 'enabled'}.`);
  }
};
