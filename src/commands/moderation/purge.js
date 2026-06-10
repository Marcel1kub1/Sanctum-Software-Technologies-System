const { SlashCommandBuilder } = require('discord.js');
const Command = require('../../structures/Command');

module.exports = class PurgeCommand extends Command {
  constructor(bot) {
    super(bot);
    this.name = 'purge';
    this.description = 'Bulk delete messages';
    this.category = 'moderation';
    this.permissions = ['ManageMessages'];
    this.slashData = new SlashCommandBuilder()
      .setName(this.name)
      .setDescription(this.description)
      .addIntegerOption(opt => opt.setName('amount').setDescription('Number of messages to delete').setRequired(true).setMinValue(1).setMaxValue(100));
  }

  async execute(bot, message, args) {
    const amount = parseInt(args[0]) || 50;
    if (amount < 1 || amount > 100) {
      await message.reply('Amount must be between 1 and 100.');
      return;
    }
    await message.channel.bulkDelete(amount, true);
    const msg = await message.channel.send(`Deleted ${amount} messages.`);
    setTimeout(() => msg.delete().catch(() => {}), 3000);
  }

  async executeSlash(bot, interaction) {
    const amount = interaction.options.getInteger('amount');
    await interaction.channel.bulkDelete(amount, true);
    const msg = await interaction.reply({ content: `Deleted ${amount} messages.`, fetchReply: true });
    if (msg?.delete) setTimeout(() => msg.delete().catch(() => {}), 3000);
  }
};
