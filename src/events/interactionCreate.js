const { handleTicketInteraction } = require('../handlers/ticketHandler');
const { handleGiveawayButton } = require('../handlers/giveawayHandler');
const { handleRoleButton } = require('../handlers/rolePanelHandler');
const { handleMusicPanelButton } = require('../handlers/musicPanelHandler');
const { handleTempVoiceButton, handleTempVoiceModal, handleTempVoiceSelect } = require('../handlers/tempVoiceHandler');
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

      if (interaction.customId.startsWith('music_panel_')) {
        return handleMusicPanelButton(bot, interaction);
      }

      const ticketCustomIds = [
        'ticket_create', 'ticket_claim', 'ticket_close', 'ticket_reopen',
        'ticket_delete', 'ticket_confirm_delete', 'ticket_cancel_delete'
      ];
      if (interaction.customId.startsWith('ticket_panel_') || ticketCustomIds.includes(interaction.customId)) {
        return handleTicketInteraction(bot, interaction);
      }

      if (interaction.customId.startsWith('role_panel_')) {
        return handleRoleButton(bot, interaction);
      }

      if (interaction.customId.startsWith('tempvoice_')) {
        return handleTempVoiceButton(bot, interaction);
      }
    }

    if (interaction.isModalSubmit()) {
      if (interaction.customId.startsWith('ticket_subject_modal_')) {
        return handleTicketInteraction(bot, interaction);
      }
      if (interaction.customId.startsWith('tempvoice_modal_')) {
        return handleTempVoiceModal(bot, interaction);
      }
    }

    if (interaction.isStringSelectMenu() && interaction.customId.startsWith('tempvoice_select_')) {
      return handleTempVoiceSelect(bot, interaction);
    }
  }
};
