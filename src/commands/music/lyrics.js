const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const axios = require('axios');
const Command = require('../../structures/Command');

module.exports = class LyricsCommand extends Command {
  constructor(bot) {
    super(bot);
    this.name = 'lyrics';
    this.description = 'Get lyrics for the current or specified song';
    this.category = 'music';
    this.slashData = new SlashCommandBuilder()
      .setName(this.name)
      .setDescription(this.description)
      .addStringOption(opt => opt.setName('song').setDescription('Song name (optional, uses current if empty)').setRequired(false));
  }

  async execute(bot, message, args) {
    let artist = '';
    let title = '';
    const query = args.join(' ');
    if (query) {
      const parts = query.split(/ - /);
      if (parts.length > 1) {
        artist = parts[0].trim();
        title = parts.slice(1).join(' - ').trim();
      } else {
        artist = query;
        title = query;
      }
    } else {
      const status = bot.lavalink.getStatus(message.guild.id);
      if (!status.current) {
        await message.reply('Nothing is playing. Provide a song name.');
        return;
      }
      artist = status.current.info.author;
      title = status.current.info.title;
    }

    try {
      const guildCfg = await bot.guildConfig(message.guild.id);
      const lyricsConfig = {
        enabled: guildCfg.music_lyrics_enabled !== undefined ? guildCfg.music_lyrics_enabled : bot.config.music.lyrics.enabled,
        provider: guildCfg.music_lyrics_provider || bot.config.music.lyrics.provider,
        geniusToken: guildCfg.music_lyrics_genius_token || bot.config.music.lyrics.geniusToken
      };
      const { fetchLyrics } = require('../../utils/lyrics');
      const lyrics = await fetchLyrics(artist, title, lyricsConfig);
      if (!lyrics) {
        await message.reply('No lyrics found for that song.');
        return;
      }

      const display = title + (artist && artist !== title ? ` - ${artist}` : '');
      const embed = new EmbedBuilder()
        .setColor('#5865f2')
        .setTitle(`Lyrics - ${display}`)
        .setDescription(lyrics.length > 4096 ? lyrics.substring(0, 4093) + '...' : lyrics);

      await message.reply({ embeds: [embed] });
    } catch (err) {
      await message.reply(`Error fetching lyrics: ${err.message}`);
    }
  }

  async executeSlash(bot, interaction) {
    let artist = '';
    let title = '';
    const query = interaction.options.getString('song');
    if (query) {
      const parts = query.split(/ - /);
      if (parts.length > 1) {
        artist = parts[0].trim();
        title = parts.slice(1).join(' - ').trim();
      } else {
        artist = query;
        title = query;
      }
    } else {
      const status = bot.lavalink.getStatus(interaction.guild.id);
      if (!status.current) {
        await interaction.reply({ content: 'Nothing is playing. Provide a song name.', ephemeral: true });
        return;
      }
      artist = status.current.info.author;
      title = status.current.info.title;
    }

    await interaction.deferReply();
    try {
      const guildCfg = await bot.guildConfig(interaction.guild.id);
      const lyricsConfig = {
        enabled: guildCfg.music_lyrics_enabled !== undefined ? guildCfg.music_lyrics_enabled : bot.config.music.lyrics.enabled,
        provider: guildCfg.music_lyrics_provider || bot.config.music.lyrics.provider,
        geniusToken: guildCfg.music_lyrics_genius_token || bot.config.music.lyrics.geniusToken
      };
      const { fetchLyrics } = require('../../utils/lyrics');
      const lyrics = await fetchLyrics(artist, title, lyricsConfig);
      if (!lyrics) {
        await interaction.editReply('No lyrics found for that song.');
        return;
      }

      const display = title + (artist && artist !== title ? ` - ${artist}` : '');
      const embed = new EmbedBuilder()
        .setColor('#5865f2')
        .setTitle(`Lyrics - ${display}`)
        .setDescription(lyrics.length > 4096 ? lyrics.substring(0, 4093) + '...' : lyrics);

      await interaction.editReply({ embeds: [embed] });
    } catch (err) {
      await interaction.editReply(`Error fetching lyrics: ${err.message}`);
    }
  }

  async fetchLyrics(artist, title, lyricsConfig) {
    if (!lyricsConfig.enabled) return null;

    if (lyricsConfig.provider === 'genius') {
      try {
        const a = artist.replace(/ \(.*?\)|\[.*?\]/g, '').trim();
        const t = title.replace(/ \(.*?\)|\[.*?\]/g, '').trim();

        if (!a || !t) return null;

        const res = await axios.get(`https://api.lyrics.ovh/v1/${encodeURIComponent(a)}/${encodeURIComponent(t)}`);
        return res.data.lyrics || null;
      } catch {
        return null;
      }
    }

    return null;
  }
};
