const config = require('../../config');
const { executeCommand } = require('../handlers/executeHandler');
const { sendLog } = require('../handlers/loggingHandler');
const { getConfig } = require('../database/guildConfig');

const processedMessages = new Set();
setInterval(() => processedMessages.clear(), 10000);

const spamTracker = new Map();
const mutedUsers = new Map();

setInterval(() => {
  const now = Date.now();
  for (const [key, data] of spamTracker) {
    data.messages = data.messages.filter(t => now - t < (data.interval || 3000));
    if (data.messages.length === 0) spamTracker.delete(key);
  }
  for (const [userId, until] of mutedUsers) {
    if (now >= until) mutedUsers.delete(userId);
  }
}, 5000);

module.exports = {
  name: 'messageCreate',
  async execute(bot, message) {
    if (message.author.bot) return;
    if (processedMessages.has(message.id)) return;
    processedMessages.add(message.id);

    const guildConfig = message.guild ? await bot.guildConfig(message.guild.id) : null;

    const isSpamCheckEnabled = guildConfig && guildConfig.automod_enabled !== false;
    if (isSpamCheckEnabled && message.guild) {
      const key = `${message.guild.id}:${message.author.id}`;
      if (!spamTracker.has(key)) {
        spamTracker.set(key, { messages: [], interval: (parseInt(guildConfig.automod_interval) || 3) * 1000 });
      }
      const tracker = spamTracker.get(key);
      tracker.messages.push(Date.now());

      if (mutedUsers.has(message.author.id)) {
        try { await message.delete(); } catch {}
        return;
      }

      const maxMessages = parseInt(guildConfig.automod_max_messages) || 5;
      if (tracker.messages.length > maxMessages) {
        const action = guildConfig.automod_action || 'warn';
        const muteDuration = (parseInt(guildConfig.automod_mute_duration) || 60) * 1000;
        const muteRoleName = guildConfig.automod_mute_role || 'Muted';

        spamTracker.delete(key);

        if (action === 'mute') {
          let muteRole = message.guild.roles.cache.find(r => r.name === muteRoleName);
          if (!muteRole) {
            try {
              muteRole = await message.guild.roles.create({
                name: muteRoleName,
                color: 0x808080,
                permissions: []
              });
              message.guild.channels.cache.forEach(async ch => {
                try {
                  await ch.permissionOverwrites.create(muteRole, { SendMessages: false, AddReactions: false });
                } catch {}
              });
            } catch {}
          }

          if (muteRole) {
            try {
              await message.member.roles.add(muteRole);
              mutedUsers.set(message.author.id, Date.now() + muteDuration);
              setTimeout(async () => {
                try {
                  const member = await message.guild.members.fetch(message.author.id).catch(() => null);
                  if (member && muteRole) await member.roles.remove(muteRole).catch(() => {});
                } catch {}
              }, muteDuration);
            } catch {}
          }
          try { await message.channel.send(`⚠️ ${message.author}, you have been muted for spamming.`); } catch {}
        } else if (action === 'kick') {
          try {
            await message.member.kick('Auto-mod: spam');
          } catch {}
        } else {
          try { await message.channel.send(`⚠️ ${message.author}, please do not spam.`); } catch {}
        }

        const logChannelId = guildConfig.automod_log_channel || guildConfig.logging_modlogs || guildConfig.logging_channel;
        if (logChannelId) {
          const logCh = message.guild.channels.cache.get(logChannelId);
          if (logCh) {
            try {
              await logCh.send({
                embeds: [{
                  color: 0xff3333,
                  title: 'Auto-Mod: Spam Detected',
                  fields: [
                    { name: 'User', value: `${message.author.tag} (${message.author.id})`, inline: true },
                    { name: 'Action', value: action, inline: true },
                    { name: 'Channel', value: `<#${message.channel.id}>`, inline: true },
                    { name: 'Messages', value: `${tracker.messages.length} in ${tracker.interval / 1000}s`, inline: true }
                  ],
                  timestamp: new Date().toISOString()
                }]
              });
            } catch {}
          }
        }
      }
    }

    const prefix = config.bot.prefix;
    if (!message.content.startsWith(prefix)) return;

    const args = message.content.slice(prefix.length).trim().split(/ +/);
    const commandName = args.shift().toLowerCase();

    const command = bot.commands.get(commandName);
    if (!command) return;

    await executeCommand(bot, command, 'prefix', { message, args });
  }
};
