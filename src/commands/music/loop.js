const { SlashCommandBuilder } = require('discord.js');
const Command = require('../../structures/Command');

module.exports = class LoopCommand extends Command {
  constructor(bot) {
    super(bot);
    this.name = 'loop';
    this.description = 'Set loop/autoplay mode';
    this.category = 'music';
    this.slashData = new SlashCommandBuilder()
      .setName(this.name)
      .setDescription(this.description)
      .addStringOption(opt => opt.setName('mode').setDescription('Loop mode').setRequired(true)
        .addChoices(
          { name: 'Off', value: 'off' },
          { name: 'Loop Track', value: 'track' },
          { name: 'Loop Queue', value: 'queue' },
          { name: 'Autoplay', value: 'autoplay' }
        ));
  }

  execute(bot, message, args) {
    if (!message.member.voice.channel) return message.reply('You need to be in a voice channel.');
    const mode = args[0] || 'off';
    if (!['off', 'track', 'queue', 'autoplay'].includes(mode)) return message.reply('Mode must be: off, track, queue, or autoplay');

    if (mode === 'autoplay') {
      bot.lavalink.setAutoplay(message.guild.id, true);
      bot.lavalink.setLoop(message.guild.id, 'autoplay');
    } else {
      bot.lavalink.setAutoplay(message.guild.id, false);
      bot.lavalink.setLoop(message.guild.id, mode);
    }
    message.reply(`Loop mode set to: ${mode}`);
  }

  executeSlash(bot, interaction) {
    if (!interaction.member.voice.channel) return interaction.reply({ content: 'You need to be in a voice channel.', ephemeral: true });
    const mode = interaction.options.getString('mode');

    if (mode === 'autoplay') {
      bot.lavalink.setAutoplay(interaction.guild.id, true);
      bot.lavalink.setLoop(interaction.guild.id, 'autoplay');
    } else {
      bot.lavalink.setAutoplay(interaction.guild.id, false);
      bot.lavalink.setLoop(interaction.guild.id, mode);
    }
    interaction.reply(`Loop mode set to: ${mode}`);
  }
};
