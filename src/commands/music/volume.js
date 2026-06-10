const { SlashCommandBuilder } = require('discord.js');
const Command = require('../../structures/Command');
const { sendOrUpdatePanel } = require('../../handlers/musicPanelHandler');

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
    if (!message.member.voice.channel) {
      await message.reply('You need to be in a voice channel.');
      return;
    }
    const volume = parseInt(args[0]);
    if (isNaN(volume) || volume < 10 || volume > 150) {
      await message.reply('Volume must be between 10 and 150.');
      return;
    }
    try {
      await bot.lavalink.setVolume(message.guild.id, volume);
      await sendOrUpdatePanel(bot, message.guild.id);
      await message.reply(`Volume set to ${volume}%.`);
    } catch (err) {
      await message.reply(`Error: ${err.message}`);
    }
  }

  async executeSlash(bot, interaction) {
    if (!interaction.member.voice.channel) {
      await interaction.reply({ content: 'You need to be in a voice channel.', ephemeral: true });
      return;
    }
    const volume = interaction.options.getInteger('level');
    await interaction.deferReply();
    try {
      await bot.lavalink.setVolume(interaction.guild.id, volume);
      await sendOrUpdatePanel(bot, interaction.guild.id);
      await interaction.editReply(`Volume set to ${volume}%.`);
    } catch (err) {
      await interaction.editReply(`Error: ${err.message}`);
    }
  }
};
