const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const Command = require('../../structures/Command');
const axios = require('axios');

module.exports = class MemeCommand extends Command {
  constructor(bot) {
    super(bot);
    this.name = 'meme';
    this.description = 'Get a random meme';
    this.category = 'fun';
    this.slashData = new SlashCommandBuilder()
      .setName(this.name)
      .setDescription(this.description);
  }

  async execute(bot, message, args) {
    try {
      const res = await axios.get('https://www.reddit.com/r/memes/random/.json');
      const data = res.data[0].data.children[0].data;
      const embed = new EmbedBuilder()
        .setTitle(data.title)
        .setImage(data.url)
        .setColor(0x5865F2)
        .setFooter({ text: `👍 ${data.ups}` });
      message.reply({ embeds: [embed] });
    } catch {
      message.reply('Could not fetch a meme right now.');
    }
  }

  async executeSlash(bot, interaction) {
    await interaction.deferReply();
    try {
      const res = await axios.get('https://www.reddit.com/r/memes/random/.json');
      const data = res.data[0].data.children[0].data;
      const embed = new EmbedBuilder()
        .setTitle(data.title)
        .setImage(data.url)
        .setColor(0x5865F2)
        .setFooter({ text: `👍 ${data.ups}` });
      interaction.editReply({ embeds: [embed] });
    } catch {
      interaction.editReply('Could not fetch a meme right now.');
    }
  }
};
