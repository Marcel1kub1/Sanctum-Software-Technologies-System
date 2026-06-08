const { EmbedBuilder, Colors } = require('discord.js');
const db = require('../database/connection');

async function handleGiveawayButton(bot, interaction) {
  if (interaction.customId !== 'enter_giveaway') return;

  const giveaway = await db.query(
    'SELECT * FROM giveaways WHERE message_id = ? AND channel_id = ?',
    [interaction.message.id, interaction.channel.id]
  );

  if (giveaway.length === 0) {
    return interaction.reply({ content: 'This giveaway no longer exists.', ephemeral: true });
  }

  const g = giveaway[0];
  if (g.ended) {
    return interaction.reply({ content: 'This giveaway has already ended.', ephemeral: true });
  }

  if (Date.now() > g.end_time) {
    return interaction.reply({ content: 'This giveaway has already ended.', ephemeral: true });
  }

  const entrants = JSON.parse(g.entrants || '[]');
  if (entrants.includes(interaction.user.id)) {
    return interaction.reply({ content: 'You have already entered this giveaway!', ephemeral: true });
  }

  entrants.push(interaction.user.id);
  await db.query('UPDATE giveaways SET entrants = ? WHERE message_id = ?', [JSON.stringify(entrants), interaction.message.id]);

  await interaction.reply({ content: '🎉 You have entered the giveaway!', ephemeral: true });
}

async function checkGiveaways(bot) {
  try {
    const now = Date.now();
    const expired = await db.query(
      'SELECT * FROM giveaways WHERE ended = 0 AND end_time <= ?',
      [now]
    );

    for (const giveaway of expired) {
      const channel = bot.channels.cache.get(giveaway.channel_id);
      if (!channel) {
        await db.query('UPDATE giveaways SET ended = 1 WHERE message_id = ?', [giveaway.message_id]);
        continue;
      }

      const msg = await channel.messages.fetch(giveaway.message_id).catch(() => null);
      if (!msg) {
        await db.query('UPDATE giveaways SET ended = 1 WHERE message_id = ?', [giveaway.message_id]);
        continue;
      }

      const entrants = JSON.parse(giveaway.entrants || '[]');
      const winnersCount = giveaway.winners || 1;

      if (entrants.length === 0) {
        await msg.reply({ embeds: [
          new EmbedBuilder()
            .setColor(Colors.Red)
            .setTitle(`🎉 ${giveaway.prize}`)
            .setDescription('No one entered this giveaway.')
            .setTimestamp()
        ]});
        await db.query('UPDATE giveaways SET ended = 1 WHERE message_id = ?', [giveaway.message_id]);
        continue;
      }

      const winnerIds = [];
      const pool = [...entrants];
      for (let i = 0; i < Math.min(winnersCount, pool.length); i++) {
        const idx = Math.floor(Math.random() * pool.length);
        winnerIds.push(pool[idx]);
        pool.splice(idx, 1);
      }

      const winnerMentions = winnerIds.map(id => `<@${id}>`).join(', ');
      const resultEmbed = new EmbedBuilder()
        .setColor(Colors.Green)
        .setTitle(`🎉 ${giveaway.prize}`)
        .setDescription(`**Winner(s):** ${winnerMentions}\nCongratulations!`)
        .setTimestamp();

      await msg.reply({ content: winnerMentions, embeds: [resultEmbed] });
      await msg.edit({ components: [] });

      await db.query('UPDATE giveaways SET ended = 1 WHERE message_id = ?', [giveaway.message_id]);
    }
  } catch (err) {
    console.error('[GiveawayChecker] Error:', err.message);
  }
}

module.exports = { handleGiveawayButton, checkGiveaways };
