const { SlashCommandBuilder, PermissionsBitField } = require('discord.js');
const Command = require('../../structures/Command');
const db = require('../../database/connection');

module.exports = class AntiSpamCommand extends Command {
  constructor(bot) {
    super(bot);
    this.name = 'antispam';
    this.description = 'Toggle anti-spam protection';
    this.category = 'security';
    this.permissions = ['Administrator'];
    this.slashData = new SlashCommandBuilder()
      .setName(this.name)
      .setDescription(this.description)
      .addStringOption(opt => opt.setName('mode').setDescription('Enable or disable').setRequired(true).addChoices({ name: 'On', value: 'on' }, { name: 'Off', value: 'off' }));
  }

  async execute(bot, message, args) {
    const mode = args[0]?.toLowerCase();
    if (!['on', 'off'].includes(mode)) return message.reply('Usage: !antispam <on|off>');
    await db.query('UPDATE guilds SET auto_mod_level = ? WHERE guild_id = ?', [mode === 'on' ? 'strict' : 'off', message.guild.id]);
    message.reply(`Anti-spam has been turned ${mode}.`);
  }

  async executeSlash(bot, interaction) {
    const mode = interaction.options.getString('mode');
    await db.query('UPDATE guilds SET auto_mod_level = ? WHERE guild_id = ?', [mode === 'on' ? 'strict' : 'off', interaction.guild.id]);
    interaction.reply(`Anti-spam has been turned ${mode}.`);
  }
};
