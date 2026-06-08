const { SlashCommandBuilder } = require('discord.js');
const Command = require('../../structures/Command');

module.exports = class SkipCommand extends Command {
  constructor(bot) {
    super(bot);
    this.name = 'skip';
    this.description = 'Skip the current track';
    this.category = 'music';
    this.slashData = new SlashCommandBuilder()
      .setName(this.name)
      .setDescription(this.description);
  }

  async execute(bot, message) {
    if (!message.member.voice.channel) {
      await message.reply('You need to be in a voice channel.');
      return;
    }
    try {
      const next = await bot.lavalink.skip(message.guild.id);
      if (next) {
        await message.reply(`Skipped. Now playing: **${next.info.title}**`);
      } else {
        await message.reply('Skipped. Queue is now empty.');
      }
    } catch (err) {
      await message.reply(`Error: ${err.message}`);
    }
  }

  async executeSlash(bot, interaction) {
    if (!interaction.member.voice.channel) {
      await interaction.reply({ content: 'You need to be in a voice channel.', ephemeral: true });
      return;
    }
    await interaction.deferReply();
    try {
      const next = await bot.lavalink.skip(interaction.guild.id);
      if (next) {
        await interaction.editReply(`Skipped. Now playing: **${next.info.title}**`);
      } else {
        await interaction.editReply('Skipped. Queue is now empty.');
      }
    } catch (err) {
      await interaction.editReply(`Error: ${err.message}`);
    }
  }
};
