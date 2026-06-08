const db = require('../../database/connection');

class User {
  static async get(userId) {
    return db.getUser(userId);
  }

  static async update(userId, data) {
    const keys = Object.keys(data);
    const values = Object.values(data);
    const setStr = keys.map(k => `${k} = ?`).join(', ');
    await db.query(`UPDATE users SET ${setStr} WHERE user_id = ?`, [...values, userId]);
  }

  static async setBalance(userId, amount) {
    await db.query('UPDATE users SET balance = ? WHERE user_id = ?', [amount, userId]);
  }

  static async addBalance(userId, amount) {
    await db.query('UPDATE users SET balance = balance + ? WHERE user_id = ?', [amount, userId]);
  }

  static async removeBalance(userId, amount) {
    await db.query('UPDATE users SET balance = balance - ? WHERE user_id = ?', [amount, userId]);
  }

  static async getLeaderboard(limit = 10) {
    return db.query('SELECT user_id, balance FROM users ORDER BY balance DESC LIMIT ?', [limit]);
  }
}

module.exports = User;
