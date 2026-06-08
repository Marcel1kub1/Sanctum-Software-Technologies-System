const { SlashCommandBuilder } = require('discord.js');
const Command = require('../../structures/Command');

module.exports = class PingCommand extends Command {
  constructor(bot) {
    super(bot);
    this.name = 'ping';
    this.description = 'Check the bot\'s latency';
    this.category = 'utility';
    this.slashData = new SlashCommandBuilder()
      .setName(this.name)
      .setDescription(this.description);
  }

  async execute(bot, message, args) {
    const msg = await message.channel.send('Pinging...');
    const latency = msg.createdTimestamp - message.createdTimestamp;
    await msg.edit(`Pong! Latency: ${latency}ms | API: ${Math.round(bot.ws.ping)}ms`);
  }

  async executeSlash(bot, interaction) {
    await interaction.deferReply();
    const latency = Date.now() - interaction.createdTimestamp;
    await interaction.editReply(`Pong! Latency: ${latency}ms | API: ${Math.round(bot.ws.ping)}ms`);
  }
};
