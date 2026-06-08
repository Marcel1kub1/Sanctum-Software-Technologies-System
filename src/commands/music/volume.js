const { SlashCommandBuilder } = require('discord.js');
const Command = require('../../structures/Command');

module.exports = class VolumeCommand extends Command {
  constructor(bot) {
    super(bot);
    this.name = 'volume';
    this.description = 'Change the volume (10-150)';
    this.category = 'music';
    this.slashData = new SlashCommandBuilder()
      .setName(this.name)
      .setDescription(this.description)
      .addIntegerOption(opt => opt.setName('level').setDescription('Volume level (10-150)').setRequired(true).setMinValue(10).setMaxValue(150));
  }

  async execute(bot, message, args) {
    if (!message.member.voice.channel) return message.reply('You need to be in a voice channel.');
    const volume = parseInt(args[0]);
    if (isNaN(volume) || volume < 10 || volume > 150) return message.reply('Volume must be between 10 and 150.');
    try {
      await bot.lavalink.setVolume(message.guild.id, volume);
      message.reply(`Volume set to ${volume}%.`);
    } catch (err) {
      message.reply(`Error: ${err.message}`);
    }
  }

  async executeSlash(bot, interaction) {
    if (!interaction.member.voice.channel) return interaction.reply({ content: 'You need to be in a voice channel.', ephemeral: true });
    const volume = interaction.options.getInteger('level');
    try {
      await bot.lavalink.setVolume(interaction.guild.id, volume);
      interaction.reply(`Volume set to ${volume}%.`);
    } catch (err) {
      interaction.reply(`Error: ${err.message}`);
    }
  }
};
