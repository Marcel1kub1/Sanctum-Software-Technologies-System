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
    if (!msgId) return message.reply('Please provide a giveaway message ID.');
    const giveaway = await db.getGiveaway(msgId);
    if (!giveaway) return message.reply('Giveaway not found.');
    const entrants = JSON.parse(giveaway.entrants || '[]');
    if (entrants.length === 0) return message.reply('No entrants found.');
    const winner = entrants[Math.floor(Math.random() * entrants.length)];
    message.reply(`🎉 New winner: <@${winner}> for **${giveaway.prize}**`);
  }

  async executeSlash(bot, interaction) {
    const msgId = interaction.options.getString('message_id');
    const giveaway = await db.getGiveaway(msgId);
    if (!giveaway) return interaction.reply({ content: 'Giveaway not found.', ephemeral: true });
    const entrants = JSON.parse(giveaway.entrants || '[]');
    if (entrants.length === 0) return interaction.reply({ content: 'No entrants found.', ephemeral: true });
    const winner = entrants[Math.floor(Math.random() * entrants.length)];
    interaction.reply(`🎉 New winner: <@${winner}> for **${giveaway.prize}**`);
  }
};
