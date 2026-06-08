module.exports = {
  name: 'interactionCreate',
  async execute(bot, interaction) {
    if (!interaction.isCommand()) return;

    const command = bot.slashCommands.get(interaction.commandName);
    if (!command) return;

    try {
      await command.executeSlash(bot, interaction);
    } catch (err) {
      console.error(`[Error] Slash Command ${interaction.commandName}:`, err.message);
      if (interaction.replied || interaction.deferred) {
        await interaction.followUp({ content: 'An error occurred while executing that command.', ephemeral: true });
      } else {
        await interaction.reply({ content: 'An error occurred while executing that command.', ephemeral: true });
      }
    }
  }
};
