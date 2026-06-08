const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const Command = require('../../structures/Command');

module.exports = class ServerInfoCommand extends Command {
  constructor(bot) {
    super(bot);
    this.name = 'serverinfo';
    this.description = 'Display information about this server';
    this.category = 'utility';
    this.slashData = new SlashCommandBuilder()
      .setName(this.name)
      .setDescription(this.description);
  }

  async execute(bot, message, args) {
    const g = message.guild;
    const embed = new EmbedBuilder()
      .setTitle(g.name)
      .setThumbnail(g.iconURL())
      .setColor(0x5865F2)
      .addFields(
        { name: 'Owner', value: `<@${g.ownerId}>`, inline: true },
        { name: 'Members', value: `${g.memberCount}`, inline: true },
        { name: 'Created', value: `<t:${Math.floor(g.createdTimestamp / 1000)}:R>`, inline: true },
        { name: 'Channels', value: `${g.channels.cache.size}`, inline: true },
        { name: 'Roles', value: `${g.roles.cache.size}`, inline: true },
        { name: 'Boost Level', value: `Level ${g.premiumTier}`, inline: true }
      );
    message.reply({ embeds: [embed] });
  }

  async executeSlash(bot, interaction) {
    const g = interaction.guild;
    const embed = new EmbedBuilder()
      .setTitle(g.name)
      .setThumbnail(g.iconURL())
      .setColor(0x5865F2)
      .addFields(
        { name: 'Owner', value: `<@${g.ownerId}>`, inline: true },
        { name: 'Members', value: `${g.memberCount}`, inline: true },
        { name: 'Created', value: `<t:${Math.floor(g.createdTimestamp / 1000)}:R>`, inline: true },
        { name: 'Channels', value: `${g.channels.cache.size}`, inline: true },
        { name: 'Roles', value: `${g.roles.cache.size}`, inline: true },
        { name: 'Boost Level', value: `Level ${g.premiumTier}`, inline: true }
      );
    interaction.reply({ embeds: [embed] });
  }
};
