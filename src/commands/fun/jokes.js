const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const Command = require('../../structures/Command');

const jokes = [
  'Why don\'t scientists trust atoms? Because they make up everything!',
  'What do you call a fake noodle? An impasta!',
  'Why did the scarecrow win an award? He was outstanding in his field!',
  'What do you call a fish with no eyes? A fsh!',
  'Why don\'t eggs tell jokes? They\'d crack each other up!',
  'What do you call a bear with no teeth? A gummy bear!',
  'Why did the math book look so sad? Because it had too many problems.',
  'What do you get when you cross a snowman and a vampire? Frostbite.',
  'Why couldn\'t the bicycle stand up by itself? It was two-tired!',
  'How does a penguin build its house? Igloos it together!',
  'Why did the golfer wear two pairs of pants? In case he got a hole in one.',
  'What do you call a belt made of watches? A waist of time.',
  'Why don\'t skeletons fight each other? They don\'t have the guts.',
  'What did the ocean say to the beach? Nothing, it just waved.',
  'Why did the coffee file a police report? It got mugged.',
  'How do you organize a space party? You planet.',
  'What do you call a pig that does karate? A pork chop!',
  'Why did the tomato turn red? Because it saw the salad dressing!',
  'What do you call a factory that sells generally okay products? A satis-factory.',
  'Why did the scarecrow become a DJ? Because he was outstanding with the beat!',
  'What do you call a lazy kangaroo? A pouch potato.',
  'Why did the banana go to the doctor? It wasn\'t peeling well.',
  'How do you catch a squirrel? Climb a tree and act like a nut!',
];

module.exports = class JokesCommand extends Command {
  constructor(bot) {
    super(bot);
    this.name = 'jokes';
    this.description = 'Get a random joke';
    this.category = 'fun';
    this.aliases = ['joke'];
    this.permissions = [];
    this.slashData = new SlashCommandBuilder()
      .setName(this.name)
      .setDescription(this.description);
  }

  async execute(bot, message, args) {
    const joke = jokes[Math.floor(Math.random() * jokes.length)];
    const embed = new EmbedBuilder()
      .setTitle('😂 Random Joke')
      .setDescription(joke)
      .setColor(0xFFA500);
    await message.reply({ embeds: [embed] });
  }

  async executeSlash(bot, interaction) {
    const joke = jokes[Math.floor(Math.random() * jokes.length)];
    const embed = new EmbedBuilder()
      .setTitle('😂 Random Joke')
      .setDescription(joke)
      .setColor(0xFFA500);
    await interaction.reply({ embeds: [embed] });
  }
};
