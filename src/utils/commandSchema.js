/**
 * Command Schema System - Defines configuration for commands
 */

const COMMAND_SCHEMAS = {
  'play': {
    name: 'Play Command',
    description: 'Play music from YouTube, Spotify, SoundCloud',
    category: 'music',
    fields: [
      {
        key: 'play_enabled',
        label: 'Enable Command',
        type: 'toggle',
        default: true,
        group: 'General'
      },
      {
        key: 'play_cooldown',
        label: 'Cooldown (seconds)',
        type: 'number',
        default: 3,
        min: 0,
        group: 'Cooldown'
      },
      {
        key: 'play_require_role',
        label: 'Require Role (optional)',
        type: 'roles',
        default: '',
        group: 'Permissions'
      },
      {
        key: 'play_max_queue_length',
        label: 'Max Song Duration (minutes)',
        type: 'number',
        default: 600,
        group: 'Limits'
      }
    ]
  },

  'skip': {
    name: 'Skip Command',
    description: 'Skip current song',
    category: 'music',
    fields: [
      {
        key: 'skip_enabled',
        label: 'Enable Command',
        type: 'toggle',
        default: true,
        group: 'General'
      },
      {
        key: 'skip_cooldown',
        label: 'Cooldown (seconds)',
        type: 'number',
        default: 2,
        min: 0,
        group: 'Cooldown'
      },
      {
        key: 'skip_require_role',
        label: 'Require Role (optional)',
        type: 'roles',
        default: '',
        group: 'Permissions'
      },
      {
        key: 'skip_require_dj_role',
        label: 'Require DJ Role',
        type: 'toggle',
        default: false,
        group: 'Permissions'
      }
    ]
  },

  'warn': {
    name: 'Warn Command',
    description: 'Warn a user with infraction',
    category: 'moderation',
    fields: [
      {
        key: 'warn_enabled',
        label: 'Enable Command',
        type: 'toggle',
        default: true,
        group: 'General'
      },
      {
        key: 'warn_require_role',
        label: 'Require Role',
        type: 'roles',
        default: '',
        required: true,
        group: 'Permissions'
      },
      {
        key: 'warn_log_channel',
        label: 'Log Channel',
        type: 'channel',
        default: '',
        group: 'Logging'
      }
    ]
  },

  'ban': {
    name: 'Ban Command',
    description: 'Ban a user from the server',
    category: 'moderation',
    fields: [
      {
        key: 'ban_enabled',
        label: 'Enable Command',
        type: 'toggle',
        default: true,
        group: 'General'
      },
      {
        key: 'ban_require_role',
        label: 'Require Role',
        type: 'roles',
        default: '',
        required: true,
        group: 'Permissions'
      },
      {
        key: 'ban_delete_messages_days',
        label: 'Delete Messages (days)',
        type: 'number',
        default: 7,
        min: 0,
        max: 7,
        group: 'Action'
      }
    ]
  },

  'kick': {
    name: 'Kick Command',
    description: 'Kick a user from the server',
    category: 'moderation',
    fields: [
      {
        key: 'kick_enabled',
        label: 'Enable Command',
        type: 'toggle',
        default: true,
        group: 'General'
      },
      {
        key: 'kick_require_role',
        label: 'Require Role',
        type: 'roles',
        default: '',
        required: true,
        group: 'Permissions'
      }
    ]
  },

  'mute': {
    name: 'Mute Command',
    description: 'Mute a user',
    category: 'moderation',
    fields: [
      {
        key: 'mute_enabled',
        label: 'Enable Command',
        type: 'toggle',
        default: true,
        group: 'General'
      },
      {
        key: 'mute_require_role',
        label: 'Require Role',
        type: 'roles',
        default: '',
        required: true,
        group: 'Permissions'
      },
      {
        key: 'mute_role',
        label: 'Mute Role',
        type: 'roles',
        default: '',
        group: 'Action'
      }
    ]
  },

  'unmute': {
    name: 'Unmute Command',
    description: 'Unmute a user',
    category: 'moderation',
    fields: [
      {
        key: 'unmute_enabled',
        label: 'Enable Command',
        type: 'toggle',
        default: true,
        group: 'General'
      },
      {
        key: 'unmute_require_role',
        label: 'Require Role',
        type: 'roles',
        default: '',
        group: 'Permissions'
      }
    ]
  },

  'daily': {
    name: 'Daily Command',
    description: 'Claim daily currency reward',
    category: 'economy',
    fields: [
      {
        key: 'daily_enabled',
        label: 'Enable Command',
        type: 'toggle',
        default: true,
        group: 'General'
      },
      {
        key: 'daily_cooldown_hours',
        label: 'Cooldown (hours)',
        type: 'number',
        default: 24,
        min: 1,
        group: 'Cooldown'
      },
      {
        key: 'daily_amount',
        label: 'Reward Amount',
        type: 'number',
        default: 100,
        min: 1,
        group: 'Reward'
      }
    ]
  },

  'balance': {
    name: 'Balance Command',
    description: 'Check user currency balance',
    category: 'economy',
    fields: [
      {
        key: 'balance_enabled',
        label: 'Enable Command',
        type: 'toggle',
        default: true,
        group: 'General'
      },
      {
        key: 'balance_cooldown',
        label: 'Cooldown (seconds)',
        type: 'number',
        default: 1,
        min: 0,
        group: 'Cooldown'
      }
    ]
  },

  'giveaway': {
    name: 'Giveaway Command',
    description: 'Start a giveaway',
    category: 'giveaways',
    fields: [
      {
        key: 'giveaway_enabled',
        label: 'Enable Command',
        type: 'toggle',
        default: true,
        group: 'General'
      },
      {
        key: 'giveaway_require_role',
        label: 'Require Role',
        type: 'roles',
        default: '',
        required: true,
        group: 'Permissions'
      }
    ]
  },

  'help': {
    name: 'Help Command',
    description: 'Show command help',
    category: 'utility',
    fields: [
      {
        key: 'help_enabled',
        label: 'Enable Command',
        type: 'toggle',
        default: true,
        group: 'General'
      },
      {
        key: 'help_show_disabled_commands',
        label: 'Show Disabled Commands',
        type: 'toggle',
        default: false,
        group: 'Display'
      }
    ]
  }
};

function getCommandSchema(commandName) {
  return COMMAND_SCHEMAS[commandName] || null;
}

function getAllCommands() {
  return Object.entries(COMMAND_SCHEMAS).map(([key, schema]) => ({
    key,
    ...schema
  }));
}

function getCommandField(commandName, fieldKey) {
  const schema = getCommandSchema(commandName);
  if (!schema) return null;
  return schema.fields.find(field => field.key === fieldKey) || null;
}

function getCommandsByCategory(category) {
  return getAllCommands().filter(cmd => cmd.category === category);
}

module.exports = {
  COMMAND_SCHEMAS,
  getCommandSchema,
  getAllCommands,
  getCommandField,
  getCommandsByCategory
};
