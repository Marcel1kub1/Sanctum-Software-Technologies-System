const { SlashCommandBuilder } = require('discord.js');
const Command = require('../../structures/Command');
const { sendOrUpdatePanel } = require('../../handlers/musicPanelHandler');

module.exports = class PreviousCommand extends Command {
  constructor(bot) {
    super(bot);
    this.name = 'previous';
    this.description = 'Play the previous track';
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
      const prev = await bot.lavalink.previous(message.guild.id);
      await sendOrUpdatePanel(bot, message.guild.id);
      if (prev) {
        await message.reply(`Now playing previous track: **${prev.info.title}**`);
      } else {
        await message.reply('No previous track available.');
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
      const prev = await bot.lavalink.previous(interaction.guild.id);
      await sendOrUpdatePanel(bot, interaction.guild.id);
      if (prev) {
        await interaction.editReply(`Now playing previous track: **${prev.info.title}**`);
      } else {
        await interaction.editReply('No previous track available.');
      }
    } catch (err) {
      await interaction.editReply(`Error: ${err.message}`);
    }
  }
};
