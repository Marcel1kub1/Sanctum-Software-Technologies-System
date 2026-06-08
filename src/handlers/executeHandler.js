const { PermissionsBitField, Collection } = require('discord.js');

function checkPermissions(member, requiredPerms) {
  if (!requiredPerms || requiredPerms.length === 0) return null;
  const missing = requiredPerms.filter(perm => !member.permissions.has(perm));
  return missing.length > 0 ? missing : null;
}

function checkCooldown(bot, command, userId) {
  if (!bot.cooldowns) bot.cooldowns = new Collection();
  if (!bot.cooldowns.has(command.name)) {
    bot.cooldowns.set(command.name, new Collection());
  }

  const now = Date.now();
  const timestamps = bot.cooldowns.get(command.name);
  const cooldownAmount = (command.cooldown || 3) * 1000;

  if (timestamps.has(userId)) {
    const expirationTime = timestamps.get(userId) + cooldownAmount;
    if (now < expirationTime) {
      const timeLeft = (expirationTime - now) / 1000;
      return timeLeft;
    }
  }

  timestamps.set(userId, now);
  setTimeout(() => timestamps.delete(userId), cooldownAmount);
  return null;
}

async function executeCommand(bot, command, executor, type, context) {
  try {
    if (type === 'prefix') {
      const { message, args } = context;
      const missing = checkPermissions(message.member, command.permissions);
      if (missing) {
        await message.reply(`You need the ${missing.join(', ')} permission(s) to use this command.`);
        return;
      }
      const cooldown = checkCooldown(bot, command, message.author.id);
      if (cooldown) {
        await message.reply(`Please wait ${cooldown.toFixed(1)}s before using \`${command.name}\` again.`);
        return;
      }
      await command.execute(bot, message, args || []);
    } else {
      const { interaction } = context;
      const missing = checkPermissions(interaction.member, command.permissions);
      if (missing) {
        await interaction.reply({ content: `You need the ${missing.join(', ')} permission(s) to use this command.`, ephemeral: true });
        return;
      }
      const cooldown = checkCooldown(bot, command, interaction.user.id);
      if (cooldown) {
        await interaction.reply({ content: `Please wait ${cooldown.toFixed(1)}s before using \`${command.name}\` again.`, ephemeral: true });
        return;
      }
      await command.executeSlash(bot, interaction);
    }
  } catch (err) {
    console.error(`[Error] Command ${command.name}:`, err.message);
    if (type === 'prefix') {
      const { message } = context;
      await message.reply('An error occurred while executing that command.').catch(() => {});
    } else {
      const { interaction } = context;
      if (interaction.replied || interaction.deferred) {
        await interaction.followUp({ content: 'An error occurred while executing that command.', ephemeral: true });
      } else {
        await interaction.reply({ content: 'An error occurred while executing that command.', ephemeral: true });
      }
    }
  }
}

module.exports = { executeCommand, checkPermissions, checkCooldown };
