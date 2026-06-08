const db = require('../../database/connection');

class Guild {
  static async get(guildId) {
    return db.getGuild(guildId);
  }

  static async update(guildId, data) {
    const keys = Object.keys(data);
    const values = Object.values(data);
    const setStr = keys.map(k => `${k} = ?`).join(', ');
    await db.query(`UPDATE guilds SET ${setStr} WHERE guild_id = ?`, [...values, guildId]);
  }

  static async setPrefix(guildId, prefix) {
    await db.query('UPDATE guilds SET prefix = ? WHERE guild_id = ?', [prefix, guildId]);
  }

  static async setModLog(guildId, channelId) {
    await db.query('UPDATE guilds SET mod_log_channel = ? WHERE guild_id = ?', [channelId, guildId]);
  }

  static async setWelcomeChannel(guildId, channelId) {
    await db.query('UPDATE guilds SET welcome_channel = ? WHERE guild_id = ?', [channelId, guildId]);
  }

  static async setGoodbyeChannel(guildId, channelId) {
    await db.query('UPDATE guilds SET goodbye_channel = ? WHERE guild_id = ?', [channelId, guildId]);
  }

  static async setTicketCategory(guildId, categoryId) {
    await db.query('UPDATE guilds SET ticket_category = ? WHERE guild_id = ?', [categoryId, guildId]);
  }

  static async setMuteRole(guildId, roleId) {
    await db.query('UPDATE guilds SET mute_role = ? WHERE guild_id = ?', [roleId, guildId]);
  }
}

module.exports = Guild;
