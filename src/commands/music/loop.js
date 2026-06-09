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

  async execute(bot, message, args) {
    if (!message.member.voice.channel) {
      await message.reply('You need to be in a voice channel.');
      return;
    }
    try {
      const mode = args[0] || 'off';
      if (!['off', 'track', 'queue', 'autoplay'].includes(mode)) {
        await message.reply('Mode must be: off, track, queue, or autoplay');
        return;
      }

      if (mode === 'autoplay') {
        bot.lavalink.setAutoplay(message.guild.id, true);
        bot.lavalink.setLoop(message.guild.id, 'autoplay');
      } else {
        bot.lavalink.setAutoplay(message.guild.id, false);
        bot.lavalink.setLoop(message.guild.id, mode);
      }
      await message.reply(`Loop mode set to: ${mode}`);
    } catch (err) {
      await message.reply(`Error: ${err.message}`);
    }
  }

  async executeSlash(bot, interaction) {
    if (!interaction.member.voice.channel) {
      await interaction.reply({ content: 'You need to be in a voice channel.', ephemeral: true });
      return;
    }
    try {
      const mode = interaction.options.getString('mode');

      if (mode === 'autoplay') {
        bot.lavalink.setAutoplay(interaction.guild.id, true);
        bot.lavalink.setLoop(interaction.guild.id, 'autoplay');
      } else {
        bot.lavalink.setAutoplay(interaction.guild.id, false);
        bot.lavalink.setLoop(interaction.guild.id, mode);
      }
      await interaction.reply(`Loop mode set to: ${mode}`);
    } catch (err) {
      await interaction.reply(`Error: ${err.message}`);
    }
  }
};
