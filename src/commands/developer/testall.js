const { SlashCommandBuilder, EmbedBuilder, Colors } = require('discord.js');
const Command = require('../../structures/Command');
const path = require('path');
const fs = require('fs');
const {
  makeMockMessage,
  makeMockInteraction,
  makeMockOptions,
  makeMockGuild,
  makeMockMember,
  makeMockChannel,
  makeMockUser,
  makeMockRole,
  makeMockMentions,
  makeMockEmbed
} = require('../../utils/testMocks');

module.exports = class TestAllCommand extends Command {
  constructor(bot) {
    super(bot);
    this.name = 'testall';
    this.description = 'Test all loaded commands and report errors';
    this.category = 'developer';
    this.permissions = ['Administrator'];
    this.slashData = new SlashCommandBuilder()
      .setName(this.name)
      .setDescription(this.description);
  }

  async execute(bot, message, args) {
    const results = await this.runTests(bot);
    await this.report(message, null, results);
  }

  async executeSlash(bot, interaction) {
    await interaction.deferReply({ ephemeral: true });
    const results = await this.runTests(bot);
    await this.report(null, interaction, results);
  }

  async runTests(bot) {
    const results = { passed: [], warnings: [], errors: [] };
    const commandsDir = path.join(__dirname, '..');

    const categories = fs.readdirSync(commandsDir).filter(item =>
      fs.statSync(path.join(commandsDir, item)).isDirectory()
    );

    for (const category of categories) {
      const dir = path.join(commandsDir, category);
      const files = fs.readdirSync(dir).filter(f => f.endsWith('.js'));

      for (const file of files) {
        const filePath = path.join(dir, file);
        const isSelf = category === 'developer' && file === 'testall.js';
        const result = await this.testCommand(bot, filePath, category, isSelf);
        results[result.status].push(result);
      }
    }

    return results;
  }

  async testCommand(bot, filePath, category, isSelf) {
    const fileName = path.basename(filePath);
    const baseResult = {
      file: `${category}/${fileName}`,
      name: fileName.replace('.js', ''),
      errors: [],
      warnings: []
    };

    try {
      delete require.cache[require.resolve(filePath)];
      const CommandClass = require(filePath);

      if (typeof CommandClass !== 'function') {
        baseResult.status = 'errors';
        baseResult.errors.push('Module does not export a class/constructor');
        console.error(`[TestAll] FAIL ${baseResult.file}: Module does not export a class`);
        return baseResult;
      }

      let instance;
      try {
        instance = new CommandClass(bot);
      } catch (err) {
        baseResult.status = 'errors';
        baseResult.errors.push(`Constructor error: ${err.message}`);
        console.error(`[TestAll] FAIL ${baseResult.file}: Constructor threw - ${err.message}`);
        return baseResult;
      }

      if (!instance.name) {
        baseResult.status = 'errors';
        baseResult.errors.push('Command has no name');
        console.error(`[TestAll] FAIL ${baseResult.file}: Missing command name`);
        return baseResult;
      }

      if (!instance.description) {
        baseResult.warnings.push('Missing description');
        console.warn(`[TestAll] WARN ${baseResult.file}: Missing description`);
      }

      if (!instance.category) {
        baseResult.warnings.push('Missing category');
        console.warn(`[TestAll] WARN ${baseResult.file}: Missing category`);
      }

      if (instance.execute === Command.prototype.execute) {
        baseResult.warnings.push('execute() not overridden (uses base class default)');
        console.warn(`[TestAll] WARN ${baseResult.file}: execute() not overridden`);
      }

      if (instance.executeSlash === Command.prototype.executeSlash) {
        baseResult.warnings.push('executeSlash() not overridden (uses base class default)');
        console.warn(`[TestAll] WARN ${baseResult.file}: executeSlash() not overridden`);
      }

      if (!isSelf) {
        try {
          const mockMsg = makeMockMessage();
          await instance.execute(bot, mockMsg, ['test']);
        } catch (err) {
          this.recordExecError(baseResult, 'execute', err);
        }

        try {
          const mockInt = makeMockInteraction();
          await instance.executeSlash(bot, mockInt);
        } catch (err) {
          this.recordExecError(baseResult, 'executeSlash', err);
        }
      }

      if (baseResult.errors.length > 0) {
        baseResult.status = 'errors';
      } else if (baseResult.warnings.length > 0) {
        baseResult.status = 'warnings';
      } else {
        baseResult.status = 'passed';
      }

      return baseResult;
    } catch (err) {
      console.error(`[TestAll] CRITICAL ${baseResult.file}: ${err.message}`);
      if (err.stack) console.error(err.stack.split('\n').slice(0, 4).join('\n'));
      baseResult.status = 'errors';
      baseResult.errors.push(`Critical: ${err.message}`);
      return baseResult;
    }
  }

  recordExecError(baseResult, method, err) {
    const msg = err.message || String(err);
    const isHandled = this.isHandledError(msg);
    const tag = isHandled ? 'HANDLED' : 'CRASH';
    const level = isHandled ? 'warnings' : 'errors';

    if (!isHandled) {
      baseResult.errors.push(`${method}(): ${msg}`);
      console.error(`[TestAll] CRASH ${baseResult.file} ${method}(): ${msg}`);
      const stack = err.stack;
      if (stack) {
        const lines = stack.split('\n').slice(1, 4).join('\n');
        console.error(`[TestAll]   at${lines}`);
      }
    } else {
      baseResult.warnings.push(`${method}(): ${msg}`);
      console.warn(`[TestAll] HANDLED ${baseResult.file} ${method}(): ${msg}`);
    }
  }

  isHandledError(msg) {
    const handled = [
      'No Lavalink node available',
      'No player for this guild',
      'No active player',
      'No results found',
      'No available',
      'You need the',
      'Please wait',
      'Invalid',
      'Missing',
      'Insufficient',
      'provide a valid',
      'already have an existing',
      'not found',
      'No query provided',
      'Cannot find',
      'not configured',
      'An error occurred while executing',
    ];
    const lower = msg.toLowerCase();
    for (const pattern of handled) {
      if (lower.includes(pattern.toLowerCase())) return true;
    }
    return false;
  }

  async report(message, interaction, results) {
    const total = results.passed.length + results.warnings.length + results.errors.length;
    const color = results.errors.length > 0 ? Colors.Red : results.warnings.length > 0 ? Colors.Yellow : Colors.Green;

    const embed = new EmbedBuilder()
      .setColor(color)
      .setTitle('Command Test Results')
      .setDescription([
        `**Total:** ${total} commands`,
        `**Passed:** ${results.passed.length}`,
        `**Warnings:** ${results.warnings.length}`,
        `**Errors:** ${results.errors.length}`
      ].join('\n'))
      .setTimestamp();

    if (results.warnings.length > 0) {
      const list = results.warnings.slice(0, 8).map(w =>
        `• ${w.file}: ${w.warnings?.slice(0, 2).join('; ')}`
      ).join('\n');
      embed.addFields({ name: 'Warnings (handled errors)', value: list.slice(0, 1024) || 'None' });
    }

    if (results.errors.length > 0) {
      const list = results.errors.slice(0, 8).map(e =>
        `• ${e.file}: ${e.errors?.slice(0, 2).join('; ')}`
      ).join('\n');
      embed.addFields({ name: 'Errors (unhandled crashes)', value: list.slice(0, 1024) || 'None' });
    }

    if (message) {
      await message.reply({ embeds: [embed] });
    } else {
      await interaction.editReply({ embeds: [embed] });
    }

    console.log(`[TestAll] Complete: ${results.passed.length} passed, ${results.warnings.length} warnings, ${results.errors.length} errors`);
  }
};
