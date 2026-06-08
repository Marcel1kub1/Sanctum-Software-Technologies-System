const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const Command = require('../../structures/Command');

module.exports = class PlayCommand extends Command {
  constructor(bot) {
    super(bot);
    this.name = 'play';
    this.description = 'Play a song from YouTube, Spotify, or SoundCloud';
    this.category = 'music';
    this.slashData = new SlashCommandBuilder()
      .setName(this.name)
      .setDescription(this.description)
      .addStringOption(opt => opt.setName('query').setDescription('Song name or URL').setRequired(true));
  }

  async execute(bot, message, args) {
    if (!message.member.voice.channel) return message.reply('You need to be in a voice channel.');
    const query = args.join(' ');
    if (!query) return message.reply('Please provide a song name or URL.');

    try {
      const channelId = message.member.voice.channel.id;
      let player = await bot.lavalink.getPlayer(message.guild.id);
      if (!player) {
        await bot.lavalink.joinVoiceChannel(message.guild.id, channelId);
      } else if (channelId !== player.voiceChannelId) {
        return message.reply('You need to be in my voice channel.');
      }

      const result = await bot.lavalink.play(message.guild.id, query, message.author.id);
      if (result.queued) {
        message.reply(`Added to queue: **${result.track.info.title}** (position #${result.position})`);
      } else {
        message.reply(`Now playing: **${result.track.info.title}**`);
      }
    } catch (err) {
      message.reply(`Error: ${err.message}`);
    }
  }

  async executeSlash(bot, interaction) {
    if (!interaction.member.voice.channel) return interaction.reply({ content: 'You need to be in a voice channel.', ephemeral: true });
    const query = interaction.options.getString('query');

    await interaction.deferReply();
    try {
      const channelId = interaction.member.voice.channel.id;
      let player = await bot.lavalink.getPlayer(interaction.guild.id);
      if (!player) {
        await bot.lavalink.joinVoiceChannel(interaction.guild.id, channelId);
      } else if (channelId !== player.voiceChannelId) {
        return interaction.editReply('You need to be in my voice channel.');
      }

      const result = await bot.lavalink.play(interaction.guild.id, query, interaction.user.id);
      if (result.queued) {
        interaction.editReply(`Added to queue: **${result.track.info.title}** (position #${result.position})`);
      } else {
        interaction.editReply(`Now playing: **${result.track.info.title}**`);
      }
    } catch (err) {
      interaction.editReply(`Error: ${err.message}`);
    }
  }
};
