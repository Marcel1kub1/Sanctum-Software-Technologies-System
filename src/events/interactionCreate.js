const { handleTicketInteraction } = require('../handlers/ticketHandler');
const { handleGiveawayButton } = require('../handlers/giveawayHandler');
const { executeCommand } = require('../handlers/executeHandler');

module.exports = {
  name: 'interactionCreate',
  async execute(bot, interaction) {
    if (interaction.isCommand()) {
      const command = bot.slashCommands.get(interaction.commandName);
      if (!command) return;
      await executeCommand(bot, command, 'slash', { interaction });
      return;
    }

    if (interaction.isButton()) {
      if (interaction.customId === 'enter_giveaway') {
        return handleGiveawayButton(bot, interaction);
      }

      const ticketCustomIds = [
        'ticket_create', 'ticket_subject_modal',
        'ticket_claim', 'ticket_close', 'ticket_reopen',
        'ticket_delete', 'ticket_confirm_delete', 'ticket_cancel_delete'
      ];
      if (ticketCustomIds.includes(interaction.customId)) {
        return handleTicketInteraction(bot, interaction);
      }
    }

    if (interaction.isModalSubmit()) {
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
