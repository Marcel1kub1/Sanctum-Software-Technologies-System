const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const Command = require('../../structures/Command');

module.exports = class QueueCommand extends Command {
  constructor(bot) {
    super(bot);
    this.name = 'queue';
    this.description = 'Show the current music queue';
    this.category = 'music';
    this.slashData = new SlashCommandBuilder()
      .setName(this.name)
      .setDescription(this.description);
  }

  async execute(bot, message) {
    const status = bot.lavalink.getStatus(message.guild.id);

    if (!status.current && status.queueLength === 0) {
      await message.reply('The queue is empty.');
      return;
    }

    const embed = new EmbedBuilder()
      .setColor('#5865f2')
      .setTitle('Music Queue')
      .setDescription(status.current ? `**Now Playing:** ${status.current.info.title} - ${status.current.info.author}` : 'Nothing playing');

    const tracks = bot.lavalink.getQueue(message.guild.id).tracks;
    if (tracks.length > 0) {
      const list = tracks.slice(0, 15).map((t, i) => `${i + 1}. ${t.info.title} - ${t.info.author}`).join('\n');
      embed.addFields({ name: `Up Next (${tracks.length} tracks)`, value: list });
      if (tracks.length > 15) embed.setFooter({ text: `And ${tracks.length - 15} more...` });
    }

    embed.addFields({
      name: 'Settings',
      value: `Loop: ${status.loop} | Shuffle: ${status.shuffled ? 'On' : 'Off'} | Autoplay: ${status.autoplay ? 'On' : 'Off'} | Volume: ${status.volume}%`
    });

    await message.reply({ embeds: [embed] });
  }

  async executeSlash(bot, interaction) {
    const status = bot.lavalink.getStatus(interaction.guild.id);

    if (!status.current && status.queueLength === 0) {
      await interaction.reply({ content: 'The queue is empty.', ephemeral: true });
      return;
    }

    const embed = new EmbedBuilder()
      .setColor('#5865f2')
      .setTitle('Music Queue')
      .setDescription(status.current ? `**Now Playing:** ${status.current.info.title} - ${status.current.info.author}` : 'Nothing playing');

    const tracks = bot.lavalink.getQueue(interaction.guild.id).tracks;
    if (tracks.length > 0) {
      const list = tracks.slice(0, 15).map((t, i) => `${i + 1}. ${t.info.title} - ${t.info.author}`).join('\n');
      embed.addFields({ name: `Up Next (${tracks.length} tracks)`, value: list });
      if (tracks.length > 15) embed.setFooter({ text: `And ${tracks.length - 15} more...` });
    }

    embed.addFields({
      name: 'Settings',
      value: `Loop: ${status.loop} | Shuffle: ${status.shuffled ? 'On' : 'Off'} | Autoplay: ${status.autoplay ? 'On' : 'Off'} | Volume: ${status.volume}%`
    });

    await interaction.reply({ embeds: [embed] });
  }
};
