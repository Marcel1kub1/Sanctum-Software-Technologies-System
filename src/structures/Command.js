class Command {
  constructor(bot) {
    this.bot = bot;
    this.name = '';
    this.description = '';
    this.category = '';
    this.aliases = [];
    this.permissions = [];
    this.cooldown = 3;
    this.slashData = null;
  }

  async execute(bot, message, args) {
    throw new Error(`Execute method not implemented for ${this.name}`);
  }

  async executeSlash(bot, interaction) {
    throw new Error(`Slash execute method not implemented for ${this.name}`);
  }
}

module.exports = Command;
