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
      const res = await axios.get('https://meme-api.com/gimme');
      const data = res.data;
      const embed = new EmbedBuilder()
        .setTitle(data.title)
        .setURL(data.postLink)
        .setImage(data.url)
        .setColor(0x5865F2)
        .setFooter({ text: `👍 ${data.ups} | r/${data.subreddit}` });
      await message.reply({ embeds: [embed] });
    } catch {
      await message.reply('Could not fetch a meme right now.');
    }
  }

  async executeSlash(bot, interaction) {
    await interaction.deferReply();
    try {
      const res = await axios.get('https://meme-api.com/gimme');
      const data = res.data;
      const embed = new EmbedBuilder()
        .setTitle(data.title)
        .setURL(data.postLink)
        .setImage(data.url)
        .setColor(0x5865F2)
        .setFooter({ text: `👍 ${data.ups} | r/${data.subreddit}` });
      await interaction.editReply({ embeds: [embed] });
    } catch {
      await interaction.editReply('Could not fetch a meme right now.');
    }
  }
};
