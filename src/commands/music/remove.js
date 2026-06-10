const { SlashCommandBuilder } = require('discord.js');
const Command = require('../../structures/Command');
const { sendOrUpdatePanel } = require('../../handlers/musicPanelHandler');

module.exports = class RemoveCommand extends Command {
  constructor(bot) {
    super(bot);
    this.name = 'remove';
    this.description = 'Remove a track from the queue';
    this.category = 'music';
    this.slashData = new SlashCommandBuilder()
      .setName(this.name)
      .setDescription(this.description)
      .addIntegerOption(opt => opt.setName('position').setDescription('Track position in the queue').setRequired(true).setMinValue(1));
  }

  async execute(bot, message, args) {
    if (!message.member.voice.channel) {
      await message.reply('You need to be in a voice channel.');
      return;
    }
    const index = parseInt(args[0]) - 1;
    if (isNaN(index) || index < 0) {
      await message.reply('Please provide a valid track number.');
      return;
    }

    const removed = bot.lavalink.removeTrack(message.guild.id, index);
    await sendOrUpdatePanel(bot, message.guild.id);
    if (removed) {
      await message.reply(`Removed track #${index + 1} from the queue.`);
    } else {
      await message.reply('Invalid track position.');
    }
  }

  async executeSlash(bot, interaction) {
    if (!interaction.member.voice.channel) {
      await interaction.reply({ content: 'You need to be in a voice channel.', ephemeral: true });
      return;
    }
    const position = interaction.options.getInteger('position') - 1;

    const removed = bot.lavalink.removeTrack(interaction.guild.id, position);
    await sendOrUpdatePanel(bot, interaction.guild.id);
    if (removed) {
      await interaction.reply(`Removed track #${position + 1} from the queue.`);
    } else {
      await interaction.reply('Invalid track position.');
    }
  }
};
