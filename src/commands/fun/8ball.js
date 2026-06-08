const { SlashCommandBuilder } = require('discord.js');
const Command = require('../../structures/Command');

const responses = ['Yes', 'No', 'Maybe', 'Definitely', 'Ask again later', 'Absolutely not', 'I doubt it', 'For sure', 'Never', 'Probably', 'Looking good', 'Don\'t count on it'];

module.exports = class EightBallCommand extends Command {
  constructor(bot) {
    super(bot);
    this.name = '8ball';
    this.description = 'Ask the magic 8ball a question';
    this.category = 'fun';
    this.aliases = ['eightball'];
    this.slashData = new SlashCommandBuilder()
      .setName(this.name)
      .setDescription(this.description)
      .addStringOption(opt => opt.setName('question').setDescription('Your question').setRequired(true));
  }

  async execute(bot, message, args) {
    const question = args.join(' ');
    if (!question) return message.reply('Ask a question.');
    const answer = responses[Math.floor(Math.random() * responses.length)];
    message.reply(`🎱 Question: ${question}\nAnswer: ${answer}`);
  }

  async executeSlash(bot, interaction) {
    const question = interaction.options.getString('question');
    const answer = responses[Math.floor(Math.random() * responses.length)];
    interaction.reply(`🎱 Question: ${question}\nAnswer: ${answer}`);
  }
};
