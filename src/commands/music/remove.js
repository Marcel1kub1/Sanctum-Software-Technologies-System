const { SlashCommandBuilder } = require('discord.js');
const Command = require('../../structures/Command');

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

  execute(bot, message, args) {
    if (!message.member.voice.channel) return message.reply('You need to be in a voice channel.');
    const index = parseInt(args[0]) - 1;
    if (isNaN(index) || index < 0) return message.reply('Please provide a valid track number.');

    const removed = bot.lavalink.removeTrack(message.guild.id, index);
    if (removed) {
      message.reply(`Removed track #${index + 1} from the queue.`);
    } else {
      message.reply('Invalid track position.');
    }
  }

  executeSlash(bot, interaction) {
    if (!interaction.member.voice.channel) return interaction.reply({ content: 'You need to be in a voice channel.', ephemeral: true });
    const position = interaction.options.getInteger('position') - 1;

    const removed = bot.lavalink.removeTrack(interaction.guild.id, position);
    if (removed) {
      interaction.reply(`Removed track #${position + 1} from the queue.`);
    } else {
      interaction.reply('Invalid track position.');
    }
  }
};
