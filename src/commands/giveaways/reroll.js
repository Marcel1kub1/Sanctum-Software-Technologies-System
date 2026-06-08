const { SlashCommandBuilder } = require('discord.js');
const Command = require('../../structures/Command');
const db = require('../../database/connection');

module.exports = class GiveawayRerollCommand extends Command {
  constructor(bot) {
    super(bot);
    this.name = 'reroll';
    this.description = 'Reroll a giveaway winner';
    this.category = 'giveaways';
    this.permissions = ['ManageMessages'];
    this.slashData = new SlashCommandBuilder()
      .setName(this.name)
      .setDescription(this.description)
      .addStringOption(opt => opt.setName('message_id').setDescription('The giveaway message ID').setRequired(true));
  }

  async execute(bot, message, args) {
    const msgId = args[0];
    if (!msgId) {
      await message.reply('Please provide a giveaway message ID.');
      return;
    }
    const giveaway = await db.getGiveaway(msgId);
    if (!giveaway) {
      await message.reply('Giveaway not found.');
      return;
    }
    const entrants = JSON.parse(giveaway.entrants || '[]');
    if (entrants.length === 0) {
      await message.reply('No entrants found.');
      return;
    }
    const winner = entrants[Math.floor(Math.random() * entrants.length)];
    await message.reply(`🎉 New winner: <@${winner}> for **${giveaway.prize}**`);
  }

  async executeSlash(bot, interaction) {
    const msgId = interaction.options.getString('message_id');
    const giveaway = await db.getGiveaway(msgId);
    if (!giveaway) {
      await interaction.reply({ content: 'Giveaway not found.', ephemeral: true });
      return;
    }
    const entrants = JSON.parse(giveaway.entrants || '[]');
    if (entrants.length === 0) {
      await interaction.reply({ content: 'No entrants found.', ephemeral: true });
      return;
    }
    await interaction.deferReply();
    const winner = entrants[Math.floor(Math.random() * entrants.length)];
    await interaction.editReply(`🎉 New winner: <@${winner}> for **${giveaway.prize}**`);
  }
};
