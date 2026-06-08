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

  async execute(bot, message) {
    if (!message.member.voice.channel) {
      await message.reply('You need to be in a voice channel.');
      return;
    }
    const status = bot.lavalink.getStatus(message.guild.id);
    bot.lavalink.setShuffle(message.guild.id, !status.shuffled);
    await message.reply(`Shuffle ${status.shuffled ? 'disabled' : 'enabled'}.`);
  }

  async executeSlash(bot, interaction) {
    if (!interaction.member.voice.channel) {
      await interaction.reply({ content: 'You need to be in a voice channel.', ephemeral: true });
      return;
    }
    const status = bot.lavalink.getStatus(interaction.guild.id);
    bot.lavalink.setShuffle(interaction.guild.id, !status.shuffled);
    await interaction.reply(`Shuffle ${status.shuffled ? 'disabled' : 'enabled'}.`);
  }
};
