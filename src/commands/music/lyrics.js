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
    let query = args.join(' ');
    if (!query) {
      const status = bot.lavalink.getStatus(message.guild.id);
      if (!status.current) {
        await message.reply('Nothing is playing. Provide a song name.');
        return;
      }
      query = `${status.current.info.title} ${status.current.info.author}`;
    }

    try {
      const lyrics = await this.fetchLyrics(query, bot.config.music.lyrics);
      if (!lyrics) {
        await message.reply('No lyrics found for that song.');
        return;
      }

      const embed = new EmbedBuilder()
        .setColor('#5865f2')
        .setTitle(`Lyrics - ${query}`)
        .setDescription(lyrics.length > 4096 ? lyrics.substring(0, 4093) + '...' : lyrics);

      await message.reply({ embeds: [embed] });
    } catch (err) {
      await message.reply(`Error fetching lyrics: ${err.message}`);
    }
  }

  async executeSlash(bot, interaction) {
    let query = interaction.options.getString('song');
    if (!query) {
      const status = bot.lavalink.getStatus(interaction.guild.id);
      if (!status.current) {
        await interaction.reply({ content: 'Nothing is playing. Provide a song name.', ephemeral: true });
        return;
      }
      query = `${status.current.info.title} ${status.current.info.author}`;
    }

    await interaction.deferReply();
    try {
      const lyrics = await this.fetchLyrics(query, bot.config.music.lyrics);
      if (!lyrics) {
        await interaction.editReply('No lyrics found for that song.');
        return;
      }

      const embed = new EmbedBuilder()
        .setColor('#5865f2')
        .setTitle(`Lyrics - ${query}`)
        .setDescription(lyrics.length > 4096 ? lyrics.substring(0, 4093) + '...' : lyrics);

      await interaction.editReply({ embeds: [embed] });
    } catch (err) {
      await interaction.editReply(`Error fetching lyrics: ${err.message}`);
    }
  }

  async fetchLyrics(query, lyricsConfig) {
    if (!lyricsConfig.enabled) return null;

    if (lyricsConfig.provider === 'genius' && lyricsConfig.geniusToken) {
      try {
        const res = await axios.get('https://api.genius.com/search', {
          params: { q: query },
          headers: { Authorization: `Bearer ${lyricsConfig.geniusToken}` }
        });
        const hit = res.data.response.hits[0];
        if (!hit) return null;

        const songRes = await axios.get(hit.result.url);
        const html = songRes.data;
        const match = html.match(/<div class="lyrics">([\s\S]*?)<\/div>/);
        return match ? match[1].replace(/<[^>]*>/g, '').trim() : 'Lyrics found but could not be parsed.';
      } catch {
        return null;
      }
    }

    return null;
  }
};
