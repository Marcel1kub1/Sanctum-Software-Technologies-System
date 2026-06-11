const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const Command = require('../../structures/Command');
const { getAIResponse, checkUsage, trackUsage } = require('../../handlers/aiHandler');

module.exports = class AskCommand extends Command {
  constructor(bot) {
    super(bot);
    this.name = 'ask';
    this.description = 'Ask an AI a question';
    this.category = 'ai';
    this.aliases = [];
    this.slashData = new SlashCommandBuilder()
      .setName(this.name)
      .setDescription(this.description)
      .addStringOption(opt =>
        opt.setName('prompt')
          .setDescription('Your question or prompt')
          .setRequired(true)
      )
      .addStringOption(opt =>
        opt.setName('model')
          .setDescription('AI provider to use')
          .setRequired(false)
          .addChoices(
            { name: 'Auto', value: 'auto' },
            { name: 'Groq', value: 'groq' },
            { name: 'OpenAI', value: 'openai' },
            { name: 'Claude', value: 'claude' },
            { name: 'Gemini', value: 'gemini' }
          )
      );
  }

  async execute(bot, message, args) {
    if (!args.length) {
      await message.reply('Please provide a prompt. Usage: `!ask <prompt>` or `!ask --model groq <prompt>`');
      return;
    }

    const cfg = bot.config;
    if (!cfg.ai_enabled) {
      await message.reply('AI features are disabled.');
      return;
    }

    let model = 'auto';
    let prompt = args.join(' ');

    if (args[0] && args[0].startsWith('--')) {
      const flag = args[0].slice(2).toLowerCase();
      if (flag === 'model' && args[1]) {
        model = args[1].toLowerCase();
        prompt = args.slice(2).join(' ');
      } else {
        await message.reply(`Unknown flag: ${flag}. Use --model <provider>`);
        return;
      }
    }

    if (!prompt) {
      await message.reply('Please provide a prompt.');
      return;
    }

    if (message.guild) {
      const guildCfg = await bot.guildConfig(message.guild.id);
      const allowlist = guildCfg.ai_channel_allowlist || cfg.ai_channel_allowlist;
      if (allowlist && allowlist.length > 0) {
        const channels = Array.isArray(allowlist) ? allowlist : [allowlist];
        if (!channels.includes(message.channel.id)) {
          await message.reply('AI commands are not allowed in this channel.');
          return;
        }
      }
    }

    const dailyLimit = cfg.ai_daily_limit || 20;
    const usage = checkUsage(message.author.id, dailyLimit);
    if (usage >= dailyLimit) {
      await message.reply(`You have reached your daily AI usage limit of ${dailyLimit} requests.`);
      return;
    }

    const provider = model === 'auto' ? (cfg.ai_default_provider || 'groq') : model;
    const apiKey = cfg[`ai_${provider}_key`] || cfg[`ai_genimi_key`];
    if (!apiKey) {
      await message.reply(`No API key configured for ${provider}.`);
      return;
    }

    const loading = await message.channel.send('🤔 Thinking...');

    const response = await getAIResponse(provider, apiKey, null, prompt, null);
    trackUsage(message.author.id);

    const embed = new EmbedBuilder()
      .setColor(0x8A2BE2)
      .setTitle('AI Response')
      .setDescription(response.length > 2000 ? response.substring(0, 1997) + '...' : response)
      .addFields(
        { name: 'Provider', value: provider.charAt(0).toUpperCase() + provider.slice(1), inline: true },
        { name: 'Daily Usage', value: `${usage + 1}/${dailyLimit}`, inline: true }
      )
      .setFooter({ text: `Requested by ${message.author.tag}` })
      .setTimestamp();

    await loading.edit({ content: null, embeds: [embed] });
  }

  async executeSlash(bot, interaction) {
    const prompt = interaction.options.getString('prompt');
    const modelChoice = interaction.options.getString('model') || 'auto';

    const cfg = bot.config;
    if (!cfg.ai_enabled) {
      await interaction.reply({ content: 'AI features are disabled.', ephemeral: true });
      return;
    }

    if (interaction.guild) {
      const guildCfg = await bot.guildConfig(interaction.guild.id);
      const allowlist = guildCfg.ai_channel_allowlist || cfg.ai_channel_allowlist;
      if (allowlist && allowlist.length > 0) {
        const channels = Array.isArray(allowlist) ? allowlist : [allowlist];
        if (!channels.includes(interaction.channel.id)) {
          await interaction.reply({ content: 'AI commands are not allowed in this channel.', ephemeral: true });
          return;
        }
      }
    }

    const dailyLimit = cfg.ai_daily_limit || 20;
    const usage = checkUsage(interaction.user.id, dailyLimit);
    if (usage >= dailyLimit) {
      await interaction.reply({ content: `You have reached your daily AI usage limit of ${dailyLimit} requests.`, ephemeral: true });
      return;
    }

    await interaction.deferReply();

    const provider = modelChoice === 'auto' ? (cfg.ai_default_provider || 'groq') : modelChoice;
    const apiKey = cfg[`ai_${provider}_key`] || cfg[`ai_genimi_key`];
    if (!apiKey) {
      await interaction.editReply({ content: `No API key configured for ${provider}.` });
      return;
    }

    const response = await getAIResponse(provider, apiKey, null, prompt, null);
    trackUsage(interaction.user.id);

    const embed = new EmbedBuilder()
      .setColor(0x8A2BE2)
      .setTitle('AI Response')
      .setDescription(response.length > 2000 ? response.substring(0, 1997) + '...' : response)
      .addFields(
        { name: 'Provider', value: provider.charAt(0).toUpperCase() + provider.slice(1), inline: true },
        { name: 'Daily Usage', value: `${usage + 1}/${dailyLimit}`, inline: true }
      )
      .setFooter({ text: `Requested by ${interaction.user.tag}` })
      .setTimestamp();

    await interaction.editReply({ embeds: [embed] });
  }
};
