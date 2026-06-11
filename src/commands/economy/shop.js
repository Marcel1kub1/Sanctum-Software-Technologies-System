const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const Command = require('../../structures/Command');
const db = require('../../database/connection');

const SHOP_ITEMS = [
  { id: 'fishing_rod', name: 'Fishing Rod', price: 500, description: 'Go fishing for rare items' },
  { id: 'lucky_clover', name: 'Lucky Clover', price: 200, description: 'Increases your luck for 1 hour' },
  { id: 'xp_boost', name: 'XP Boost', price: 1000, description: 'Double XP for 30 minutes' },
  { id: 'vip_role', name: 'VIP Role Card', price: 5000, description: 'Redeem for a VIP role' }
];

module.exports = class ShopCommand extends Command {
  constructor(bot) {
    super(bot);
    this.name = 'shop';
    this.description = 'View and buy items from the shop';
    this.category = 'economy';
    this.slashData = new SlashCommandBuilder()
      .setName(this.name)
      .setDescription(this.description)
      .addSubcommand(sub => sub.setName('list').setDescription('List available shop items'))
      .addSubcommand(sub => sub.setName('buy').setDescription('Buy an item')
        .addStringOption(opt => opt.setName('item').setDescription('The item to buy').setRequired(true)
          .addChoices(
            { name: 'Fishing Rod', value: 'fishing_rod' },
            { name: 'Lucky Clover', value: 'lucky_clover' },
            { name: 'XP Boost', value: 'xp_boost' },
            { name: 'VIP Role Card', value: 'vip_role' }
          )));
  }

  async execute(bot, message, args) {
    const cfg = await bot.guildConfig(message.guild.id);

    if (args[0] === 'list' || !args[0]) {
      const currency = cfg.economy_currency || bot.config.economy.currency;
      const embed = new EmbedBuilder()
        .setTitle('Shop')
        .setColor(0x00AE86)
        .setDescription(SHOP_ITEMS.map(item =>
          `**${item.name}** - ${currency}${item.price}\n${item.description}\nID: \`${item.id}\``
        ).join('\n\n') || 'No items available.');
      await message.reply({ embeds: [embed] });
    } else if (args[0] === 'buy') {
      const itemId = args[1];
      if (!itemId) {
        await message.reply('Please specify an item to buy. Use `!shop list` to see available items.');
        return;
      }
      const item = SHOP_ITEMS.find(i => i.id === itemId);
      if (!item) {
        await message.reply('That item does not exist. Use `!shop list` to see available items.');
        return;
      }

      let rows = await db.query('SELECT * FROM economy WHERE user_id = ?', [message.author.id]);
      if (rows.length === 0) {
        await db.query('INSERT INTO economy (user_id, balance, last_weekly_time) VALUES (?, 0, 0)', [message.author.id]);
        rows = await db.query('SELECT * FROM economy WHERE user_id = ?', [message.author.id]);
      }
      const userData = rows[0];

      if (userData.balance < item.price) {
        await message.reply(`You don't have enough money to buy **${item.name}**. You need ${item.price} but you have ${userData.balance}.`);
        return;
      }

      await db.query('UPDATE economy SET balance = balance - ? WHERE user_id = ?', [item.price, message.author.id]);
      await db.query(
        'INSERT INTO economy_inventory (guild_id, user_id, item_id, purchased_at) VALUES (?, ?, ?, ?)',
        [message.guild.id, message.author.id, item.id, Date.now()]
      );

      await message.reply(`You purchased **${item.name}** for ${item.price}!`);
    } else {
      await message.reply('Usage: `!shop list` or `!shop buy <item>`');
    }
  }

  async executeSlash(bot, interaction) {
    const cfg = await bot.guildConfig(interaction.guild.id);
    const subcommand = interaction.options.getSubcommand();

    if (subcommand === 'list') {
      const currency = cfg.economy_currency || bot.config.economy.currency;
      const embed = new EmbedBuilder()
        .setTitle('Shop')
        .setColor(0x00AE86)
        .setDescription(SHOP_ITEMS.map(item =>
          `**${item.name}** - ${currency}${item.price}\n${item.description}\nID: \`${item.id}\``
        ).join('\n\n') || 'No items available.');
      await interaction.reply({ embeds: [embed] });
    } else if (subcommand === 'buy') {
      await interaction.deferReply();
      const itemId = interaction.options.getString('item');
      const item = SHOP_ITEMS.find(i => i.id === itemId);
      if (!item) {
        await interaction.editReply('That item does not exist.');
        return;
      }

      let rows = await db.query('SELECT * FROM economy WHERE user_id = ?', [interaction.user.id]);
      if (rows.length === 0) {
        await db.query('INSERT INTO economy (user_id, balance, last_weekly_time) VALUES (?, 0, 0)', [interaction.user.id]);
        rows = await db.query('SELECT * FROM economy WHERE user_id = ?', [interaction.user.id]);
      }
      const userData = rows[0];

      if (userData.balance < item.price) {
        await interaction.editReply(`You don't have enough money to buy **${item.name}**. You need ${item.price} but you have ${userData.balance}.`);
        return;
      }

      await db.query('UPDATE economy SET balance = balance - ? WHERE user_id = ?', [item.price, interaction.user.id]);
      await db.query(
        'INSERT INTO economy_inventory (guild_id, user_id, item_id, purchased_at) VALUES (?, ?, ?, ?)',
        [interaction.guild.id, interaction.user.id, item.id, Date.now()]
      );

      await interaction.editReply(`You purchased **${item.name}**!`);
    }
  }
};
