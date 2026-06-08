const { EmbedBuilder, Colors } = require('discord.js');

function createEmbed(options = {}) {
  const embed = new EmbedBuilder()
    .setColor(options.color || Colors.Blurple)
    .setTimestamp(options.timestamp || new Date());

  if (options.title) embed.setTitle(options.title);
  if (options.description) embed.setDescription(options.description);
  if (options.url) embed.setURL(options.url);
  if (options.author) embed.setAuthor(options.author);
  if (options.thumbnail) embed.setThumbnail(options.thumbnail);
  if (options.image) embed.setImage(options.image);
  if (options.footer) embed.setFooter(options.footer);
  if (options.fields) embed.addFields(options.fields);

  return embed;
}

function successEmbed(description) {
  return createEmbed({ color: Colors.Green, description: `\u2705 ${description}` });
}

function errorEmbed(description) {
  return createEmbed({ color: Colors.Red, description: `\u274C ${description}` });
}

function infoEmbed(description) {
  return createEmbed({ color: Colors.Blue, description: `\u2139\uFE0F ${description}` });
}

function warningEmbed(description) {
  return createEmbed({ color: Colors.Yellow, description: `\u26A0\uFE0F ${description}` });
}

module.exports = { createEmbed, successEmbed, errorEmbed, infoEmbed, warningEmbed };
