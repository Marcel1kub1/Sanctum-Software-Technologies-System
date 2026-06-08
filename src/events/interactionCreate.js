const { handleTicketInteraction } = require('../handlers/ticketHandler');

module.exports = {
  name: 'interactionCreate',
  async execute(bot, interaction) {
    if (interaction.isCommand()) {
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
      return;
    }

    if (interaction.isButton() || interaction.isModalSubmit()) {
      const ticketCustomIds = [
        'ticket_create', 'ticket_subject_modal',
        'ticket_claim', 'ticket_close', 'ticket_reopen',
        'ticket_delete', 'ticket_confirm_delete', 'ticket_cancel_delete'
      ];
      if (ticketCustomIds.includes(interaction.customId)) {
        return handleTicketInteraction(bot, interaction);
      }
    }
  }
};
