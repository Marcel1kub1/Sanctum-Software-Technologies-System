const { SlashCommandBuilder } = require('discord.js');
const Command = require('../../structures/Command');
const db = require('../../database/connection');

module.exports = class CloseCommand extends Command {
  constructor(bot) {
    super(bot);
    this.name = 'close';
    this.description = 'Close the current ticket';
    this.category = 'tickets';
    this.slashData = new SlashCommandBuilder()
      .setName(this.name)
      .setDescription(this.description);
  }

  async execute(bot, message, args) {
    const ticket = await db.query('SELECT * FROM tickets WHERE channel_id = ?', [message.channel.id]);
    if (ticket.length === 0) {
      await message.reply('This is not a ticket channel.');
      return;
    }
    await db.query('UPDATE tickets SET status = ?, closed_at = NOW() WHERE channel_id = ?', ['closed', message.channel.id]);
    await message.channel.send('Closing ticket in 5 seconds...');
    setTimeout(() => message.channel.delete().catch(() => {}), 5000);
  }

  async executeSlash(bot, interaction) {
    const ticket = await db.query('SELECT * FROM tickets WHERE channel_id = ?', [interaction.channel.id]);
    if (ticket.length === 0) {
      await interaction.reply({ content: 'This is not a ticket channel.', ephemeral: true });
      return;
    }
    await interaction.deferReply();
    await db.query('UPDATE tickets SET status = ?, closed_at = NOW() WHERE channel_id = ?', ['closed', interaction.channel.id]);
    await interaction.editReply('Closing ticket in 5 seconds...');
    setTimeout(() => interaction.channel.delete().catch(() => {}), 5000);
  }
};
