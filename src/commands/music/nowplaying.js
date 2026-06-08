const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const Command = require('../../structures/Command');

module.exports = class NowPlayingCommand extends Command {
  constructor(bot) {
    super(bot);
    this.name = 'nowplaying';
    this.description = 'Show the currently playing track';
    this.category = 'music';
    this.slashData = new SlashCommandBuilder()
      .setName(this.name)
      .setDescription(this.description);
  }

  async execute(bot, message) {
    const status = bot.lavalink.getStatus(message.guild.id);
    if (!status.current) {
      await message.reply('Nothing is playing right now.');
      return;
    }

    const track = status.current;
    const embed = new EmbedBuilder()
      .setColor('#5865f2')
      .setTitle('Now Playing')
      .setDescription(`**${track.info.title}**\n${track.info.author}`)
      .addFields(
        { name: 'Duration', value: formatTime(track.info.length), inline: true },
        { name: 'Volume', value: `${status.volume}%`, inline: true },
        { name: 'Loop', value: status.loop, inline: true }
      );

    if (track.info.uri) embed.setURL(track.info.uri);
    if (track.info.artworkUrl) embed.setThumbnail(track.info.artworkUrl);

    await message.reply({ embeds: [embed] });
  }

  async executeSlash(bot, interaction) {
    const status = bot.lavalink.getStatus(interaction.guild.id);
    if (!status.current) {
      await interaction.reply({ content: 'Nothing is playing right now.', ephemeral: true });
      return;
    }

    const track = status.current;
    const embed = new EmbedBuilder()
      .setColor('#5865f2')
      .setTitle('Now Playing')
      .setDescription(`**${track.info.title}**\n${track.info.author}`)
      .addFields(
        { name: 'Duration', value: formatTime(track.info.length), inline: true },
        { name: 'Volume', value: `${status.volume}%`, inline: true },
        { name: 'Loop', value: status.loop, inline: true }
      );

    if (track.info.uri) embed.setURL(track.info.uri);
    if (track.info.artworkUrl) embed.setThumbnail(track.info.artworkUrl);

    await interaction.reply({ embeds: [embed] });
  }
};

function formatTime(ms) {
  const seconds = Math.floor((ms / 1000) % 60);
  const minutes = Math.floor((ms / (1000 * 60)) % 60);
  const hours = Math.floor(ms / (1000 * 60 * 60));
  return hours > 0 ? `${hours}h ${minutes}m ${seconds}s` : `${minutes}m ${seconds}s`;
}
