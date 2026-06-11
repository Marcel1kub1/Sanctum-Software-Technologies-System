/**
 * Module Schema System - Defines configuration structure for all modules
 */

const MODULE_SCHEMAS = {
  tickets: {
    name: 'Ticket System',
    description: 'Professional ticket management with support roles',
    icon: '🎫',
    category: 'support',
    enabled: true,
    fields: [
      {
        key: 'tickets_enabled',
        label: 'Enable Module',
        type: 'toggle',
        default: true,
        group: 'General'
      },
      {
        key: 'tickets_category',
        label: 'Ticket Category',
        type: 'channel',
        default: '',
        required: true,
        group: 'General',
        hint: 'Category where ticket channels will be created'
      },
      {
        key: 'tickets_panel_channel',
        label: 'Panel Channel',
        type: 'channel',
        default: '',
        required: true,
        group: 'Panel',
        hint: 'Channel where the ticket panel will be posted'
      },
      {
        key: 'tickets_panel_title',
        label: 'Panel Title',
        type: 'text',
        default: 'Create a Ticket',
        group: 'Panel'
      },
      {
        key: 'tickets_panel_description',
        label: 'Panel Description',
        type: 'textarea',
        default: 'Click the button below to open a ticket and our team will assist you.',
        group: 'Panel'
      },
      {
        key: 'tickets_button_1_label',
        label: 'Button 1 Label',
        type: 'text',
        default: 'Commission',
        group: 'Panel Buttons'
      },
      {
        key: 'tickets_button_2_label',
        label: 'Button 2 Label',
        type: 'text',
        default: 'Apply',
        group: 'Panel Buttons'
      },
      {
        key: 'tickets_button_3_label',
        label: 'Button 3 Label',
        type: 'text',
        default: 'Support',
        group: 'Panel Buttons'
      },
      {
        key: 'tickets_button_4_label',
        label: 'Button 4 Label',
        type: 'text',
        default: 'Other',
        group: 'Panel Buttons'
      },
      {
        key: 'tickets_panel_image_url',
        label: 'Embed Image URL',
        type: 'text',
        default: '',
        group: 'Panel',
        hint: 'Optional image displayed at the top of the ticket panel embed'
      },
      {
        key: 'tickets_limit',
        label: 'Ticket Limit per User',
        type: 'number',
        default: 5,
        min: 1,
        max: 20,
        group: 'Settings'
      },
      {
        key: 'tickets_support_roles',
        label: 'Support Roles',
        type: 'roles',
        default: '',
        group: 'Settings',
        hint: 'Roles that can view and manage tickets'
      },
      {
        key: 'tickets_transcripts',
        label: 'Save Transcripts',
        type: 'toggle',
        default: true,
        group: 'Transcripts'
      },
      {
        key: 'tickets_transcript_channel',
        label: 'Transcript Channel',
        type: 'channel',
        default: '',
        group: 'Transcripts',
        hint: 'Where transcripts are saved'
      }
    ],
    panels: [
      {
        id: 'ticket_panel',
        label: 'Ticket Creation Panel',
        type: 'embed_buttons',
        configKeys: ['tickets_panel_title', 'tickets_panel_description', 'tickets_panel_image_url', 'tickets_button_1_label', 'tickets_button_2_label', 'tickets_button_3_label', 'tickets_button_4_label'],
        endpoint: '/dashboard/tickets/send'
      }
    ]
  },
  
  music: {
    name: 'Music System',
    description: 'Music playback with Lavalink',
    icon: '🎵',
    category: 'entertainment',
    enabled: true,
    fields: [
      {
        key: 'music_enabled',
        label: 'Enable Music',
        type: 'toggle',
        default: true,
        group: 'General'
      },
      {
        key: 'music_default_volume',
        label: 'Default Volume',
        type: 'number',
        default: 50,
        min: 10,
        max: 150,
        group: 'Playback'
      },
      {
        key: 'music_max_queue_size',
        label: 'Max Queue Size',
        type: 'number',
        default: 100,
        min: 10,
        group: 'Playback'
      },
      {
        key: 'music_inactivity_timeout',
        label: 'Inactivity Timeout (ms)',
        type: 'number',
        default: 300000,
        group: 'Playback'
      },
      {
        key: 'music_lyrics_enabled',
        label: 'Enable Lyrics',
        type: 'toggle',
        default: true,
        group: 'Lyrics'
      },
      {
        key: 'music_lyrics_provider',
        label: 'Lyrics Provider',
        type: 'select',
        options: [
          { label: 'Genius', value: 'genius' },
          { label: 'Lyrics.ovh', value: 'lyrics.ovh' }
        ],
        default: 'lyrics.ovh',
        group: 'Lyrics'
      },
      {
        key: 'music_lyrics_genius_token',
        label: 'Genius API Token',
        type: 'password',
        default: '',
        group: 'Lyrics',
        hint: 'Get from https://genius.com/api-clients'
      }
    ]
  },

  giveaways: {
    name: 'Giveaway System',
    description: 'Host giveaways with role requirements',
    icon: '🎁',
    category: 'engagement',
    enabled: true,
    fields: [
      {
        key: 'giveaways_enabled',
        label: 'Enable Giveaways',
        type: 'toggle',
        default: true,
        group: 'General'
      },
      {
        key: 'giveaways_min_duration',
        label: 'Min Duration (ms)',
        type: 'number',
        default: 10000,
        group: 'Settings'
      },
      {
        key: 'giveaways_max_winners',
        label: 'Max Winners',
        type: 'number',
        default: 20,
        group: 'Settings'
      }
    ]
  },

  leveling: {
    name: 'Leveling System',
    description: 'XP and level progression',
    icon: '📈',
    category: 'engagement',
    enabled: true,
    fields: [
      {
        key: 'leveling_enabled',
        label: 'Enable Leveling',
        type: 'toggle',
        default: true,
        group: 'General'
      },
      {
        key: 'leveling_xp_per_message',
        label: 'XP per Message',
        type: 'number',
        default: 15,
        min: 1,
        group: 'XP'
      },
      {
        key: 'leveling_xp_cooldown',
        label: 'XP Cooldown (ms)',
        type: 'number',
        default: 60000,
        group: 'XP'
      },
      {
        key: 'leveling_base_xp',
        label: 'Base XP per Level',
        type: 'number',
        default: 100,
        group: 'XP'
      },
      {
        key: 'leveling_xp_multiplier',
        label: 'XP Multiplier',
        type: 'number',
        default: 1.5,
        step: 0.1,
        group: 'XP'
      }
    ]
  },

  economy: {
    name: 'Economy System',
    description: 'Currency, jobs, and transactions',
    icon: '💰',
    category: 'engagement',
    enabled: true,
    fields: [
      {
        key: 'economy_enabled',
        label: 'Enable Economy',
        type: 'toggle',
        default: true,
        group: 'General'
      },
      {
        key: 'economy_currency',
        label: 'Currency Symbol',
        type: 'text',
        default: '💰',
        group: 'General'
      },
      {
        key: 'economy_daily_amount',
        label: 'Daily Claim Amount',
        type: 'number',
        default: 100,
        group: 'Daily'
      },
      {
        key: 'economy_work_min',
        label: 'Work Min Reward',
        type: 'number',
        default: 10,
        group: 'Work'
      },
      {
        key: 'economy_work_max',
        label: 'Work Max Reward',
        type: 'number',
        default: 100,
        group: 'Work'
      },
      {
        key: 'economy_starting_balance',
        label: 'Starting Balance',
        type: 'number',
        default: 500,
        group: 'Settings'
      }
    ]
  },

  automod: {
    name: 'Auto Moderation',
    description: 'Automatic moderation rules',
    icon: '🛡️',
    category: 'moderation',
    enabled: true,
    fields: [
      {
        key: 'automod_enabled',
        label: 'Enable AutoMod',
        type: 'toggle',
        default: true,
        group: 'General'
      },
      {
        key: 'automod_max_messages',
        label: 'Max Messages in Interval',
        type: 'number',
        default: 5,
        group: 'Anti-Spam'
      },
      {
        key: 'automod_interval',
        label: 'Spam Interval (seconds)',
        type: 'number',
        default: 3,
        group: 'Anti-Spam'
      },
      {
        key: 'automod_action',
        label: 'Spam Action',
        type: 'select',
        default: 'warn',
        options: [{ value: 'warn', label: 'Warn' }, { value: 'mute', label: 'Mute' }, { value: 'kick', label: 'Kick' }],
        group: 'Anti-Spam'
      },
      {
        key: 'automod_mute_duration',
        label: 'Mute Duration (seconds)',
        type: 'number',
        default: 60,
        group: 'Anti-Spam'
      },
      {
        key: 'automod_log_channel',
        label: 'AutoMod Log Channel',
        type: 'channel',
        default: '',
        group: 'General'
      },
      {
        key: 'automod_max_mentions',
        label: 'Max Mentions per Message',
        type: 'number',
        default: 5,
        group: 'Content Filtering'
      },
      {
        key: 'automod_max_links',
        label: 'Max Links per Message',
        type: 'number',
        default: 3,
        group: 'Content Filtering'
      },
      {
        key: 'automod_max_lines',
        label: 'Max Lines per Message',
        type: 'number',
        default: 10,
        group: 'Content Filtering'
      },
      {
        key: 'automod_max_caps',
        label: 'Max Caps %',
        type: 'number',
        default: 70,
        group: 'Content Filtering'
      },
      {
        key: 'automod_block_invites',
        label: 'Block Discord Invites',
        type: 'toggle',
        default: true,
        group: 'Content Filtering'
      },
      {
        key: 'automod_block_spoilers',
        label: 'Block Excessive Spoilers',
        type: 'toggle',
        default: false,
        group: 'Content Filtering'
      },
      {
        key: 'automod_block_mass_mentions',
        label: 'Block Mass Mentions',
        type: 'toggle',
        default: true,
        group: 'Content Filtering'
      }
    ]
  },

  logging: {
    name: 'Logging System',
    description: 'Log server events to channels',
    icon: '📝',
    category: 'moderation',
    enabled: true,
    fields: [
      {
        key: 'logging_enabled',
        label: 'Enable Logging',
        type: 'toggle',
        default: true,
        group: 'General'
      },
      {
        key: 'logging_channel',
        label: 'Main Log Channel',
        type: 'channel',
        default: '',
        group: 'Channels',
        hint: 'Fallback channel for all logs'
      },
      {
        key: 'logging_messagelogs',
        label: 'Message Logs Channel',
        type: 'channel',
        default: '',
        group: 'Channels'
      },
      {
        key: 'logging_memberlogs',
        label: 'Member Logs Channel',
        type: 'channel',
        default: '',
        group: 'Channels'
      },
      {
        key: 'logging_modlogs',
        label: 'Mod Logs Channel',
        type: 'channel',
        default: '',
        group: 'Channels'
      },
      {
        key: 'logging_messageedit',
        label: 'Log Message Edits',
        type: 'toggle',
        default: true,
        group: 'Events'
      },
      {
        key: 'logging_messagedelete',
        label: 'Log Message Deletes',
        type: 'toggle',
        default: true,
        group: 'Events'
      },
      {
        key: 'logging_memberjoin',
        label: 'Log Member Joins',
        type: 'toggle',
        default: true,
        group: 'Events'
      },
      {
        key: 'logging_memberleave',
        label: 'Log Member Leaves',
        type: 'toggle',
        default: true,
        group: 'Events'
      },
      {
        key: 'logging_channelchanges',
        label: 'Log Channel Changes',
        type: 'toggle',
        default: false,
        group: 'Events'
      },
      {
        key: 'logging_rolechanges',
        label: 'Log Role Changes',
        type: 'toggle',
        default: false,
        group: 'Events'
      },
      {
        key: 'logging_voiceevents',
        label: 'Log Voice Events',
        type: 'toggle',
        default: false,
        group: 'Events'
      }
    ]
  },

  verification: {
    name: 'Verification System',
    description: 'Role assignment on member join',
    icon: '✅',
    category: 'moderation',
    enabled: true,
    fields: [
      {
        key: 'verification_enabled',
        label: 'Enable Verification',
        type: 'toggle',
        default: true,
        group: 'General'
      },
      {
        key: 'verification_role',
        label: 'Verification Role',
        type: 'roles',
        default: '',
        group: 'General',
        hint: 'Role to assign after verification'
      },
      {
        key: 'verification_message',
        label: 'Verification Message',
        type: 'textarea',
        default: 'Please verify to access the server.',
        group: 'General'
      }
    ]
  },

  welcome: {
    name: 'Welcome System',
    description: 'Welcome and goodbye messages',
    icon: '👋',
    category: 'community',
    enabled: true,
    fields: [
      {
        key: 'welcome_enabled',
        label: 'Enable Welcome',
        type: 'toggle',
        default: true,
        group: 'General'
      },
      {
        key: 'welcome_channel',
        label: 'Welcome Channel',
        type: 'channel',
        default: '',
        group: 'Messages'
      },
      {
        key: 'welcome_message',
        label: 'Welcome Message',
        type: 'textarea',
        default: 'Welcome {user} to {server}!',
        group: 'Messages'
      },
      {
        key: 'goodbye_enabled',
        label: 'Enable Goodbye Message',
        type: 'toggle',
        default: true,
        group: 'Goodbye'
      },
      {
        key: 'goodbye_message',
        label: 'Goodbye Message',
        type: 'textarea',
        default: '{user} has left the server.',
        group: 'Goodbye'
      }
    ]
  },

  suggestions: {
    name: 'Suggestions System',
    description: 'Collect server suggestions',
    icon: '💡',
    category: 'community',
    enabled: true,
    fields: [
      {
        key: 'suggestions_enabled',
        label: 'Enable Suggestions',
        type: 'toggle',
        default: true,
        group: 'General'
      },
      {
        key: 'suggestions_channel',
        label: 'Suggestions Channel',
        type: 'channel',
        default: '',
        group: 'General'
      },
      {
        key: 'suggestions_vote_emoji_up',
        label: 'Upvote Emoji',
        type: 'text',
        default: '👍',
        group: 'Voting'
      },
      {
        key: 'suggestions_vote_emoji_down',
        label: 'Downvote Emoji',
        type: 'text',
        default: '👎',
        group: 'Voting'
      }
    ]
  },

  moderation: {
    name: 'Moderation Tools',
    description: 'Core moderation features',
    icon: '🛡️',
    category: 'moderation',
    enabled: true,
    fields: [
      {
        key: 'moderation_enabled',
        label: 'Enable Moderation',
        type: 'toggle',
        default: true,
        group: 'General'
      },
      {
        key: 'moderation_log_channel',
        label: 'Moderation Log Channel',
        type: 'channel',
        default: '',
        group: 'Logging'
      },
      {
        key: 'moderation_dm_user_on_action',
        label: 'DM User on Action',
        type: 'toggle',
        default: true,
        group: 'Notifications'
      }
    ]
  },

  raids: {
    name: 'Raid Protection',
    description: 'Protect against raid attacks',
    icon: '🚨',
    category: 'moderation',
    enabled: true,
    fields: [
      {
        key: 'raids_enabled',
        label: 'Enable Raid Protection',
        type: 'toggle',
        default: true,
        group: 'General'
      },
      {
        key: 'raids_max_joins_per_minute',
        label: 'Max Joins per Minute',
        type: 'number',
        default: 10,
        min: 1,
        group: 'Detection'
      },
      {
        key: 'raids_action',
        label: 'Action on Raid',
        type: 'select',
        options: [
          { label: 'Lock Server', value: 'lock' },
          { label: 'Ban All New', value: 'ban' },
          { label: 'Warn', value: 'warn' }
        ],
        default: 'lock',
        group: 'Action'
      }
    ]
  },

  infractions: {
    name: 'Infractions System',
    description: 'Track warnings and punishments',
    icon: '⚠️',
    category: 'moderation',
    enabled: true,
    fields: [
      {
        key: 'infractions_enabled',
        label: 'Enable Infractions',
        type: 'toggle',
        default: true,
        group: 'General'
      },
      {
        key: 'infractions_warnings_to_kick',
        label: 'Warnings to Auto-Kick',
        type: 'number',
        default: 5,
        group: 'Thresholds'
      },
      {
        key: 'infractions_warnings_to_ban',
        label: 'Warnings to Auto-Ban',
        type: 'number',
        default: 10,
        group: 'Thresholds'
      }
    ]
  },

  appeals: {
    name: 'Appeals System',
    description: 'Allow users to appeal bans',
    icon: '🔄',
    category: 'moderation',
    enabled: true,
    fields: [
      {
        key: 'appeals_enabled',
        label: 'Enable Appeals',
        type: 'toggle',
        default: true,
        group: 'General'
      },
      {
        key: 'appeals_form_link',
        label: 'Appeals Form Link',
        type: 'text',
        default: '',
        group: 'General'
      },
      {
        key: 'appeals_reviewer_role',
        label: 'Reviewer Role',
        type: 'roles',
        default: '',
        group: 'Permissions'
      }
    ]
  },

  reports: {
    name: 'Reports System',
    description: 'User report system',
    icon: '📋',
    category: 'moderation',
    enabled: true,
    fields: [
      {
        key: 'reports_enabled',
        label: 'Enable Reports',
        type: 'toggle',
        default: true,
        group: 'General'
      },
      {
        key: 'reports_channel',
        label: 'Reports Channel',
        type: 'channel',
        default: '',
        group: 'General'
      }
    ]
  },

  roleAssignment: {
    name: 'Role/Channel Assignment',
    description: 'Manage role and channel assignments',
    icon: '🎭',
    category: 'community',
    enabled: true,
    fields: [
      {
        key: 'role_assignment_enabled',
        label: 'Enable Role Assignment',
        type: 'toggle',
        default: true,
        group: 'General'
      }
    ]
  },

  games: {
    name: 'Games System',
    description: 'Fun game commands',
    icon: '🎮',
    category: 'entertainment',
    enabled: true,
    fields: [
      {
        key: 'games_enabled',
        label: 'Enable Games',
        type: 'toggle',
        default: true,
        group: 'General'
      }
    ]
  },

  webhooks: {
    name: 'Webhook Alerts',
    description: 'Receive Discord alerts when users access the dashboard',
    icon: '🔔',
    category: 'utility',
    enabled: true,
    fields: [
      {
        key: 'webhooks_enabled',
        label: 'Enable Webhook Alerts',
        type: 'toggle',
        default: false,
        group: 'General'
      },
      {
        key: 'webhooks_webhook_url',
        label: 'Discord Webhook URL',
        type: 'text',
        default: '',
        group: 'Webhook',
        hint: 'Paste a Discord channel webhook URL (Discord > Channel Settings > Integrations > Webhooks)'
      },
      {
        key: 'webhooks_alert_on_login',
        label: 'Alert on Dashboard Login',
        type: 'toggle',
        default: true,
        group: 'Alerts',
        hint: 'Send a notification when a user logs into the dashboard'
      },
      {
        key: 'webhooks_log_ip',
        label: 'Include IP Address',
        type: 'toggle',
        default: true,
        group: 'Alerts'
      },
      {
        key: 'webhooks_log_user_info',
        label: 'Include User Info',
        type: 'toggle',
        default: true,
        group: 'Alerts',
        hint: 'Include Discord username, ID, and avatar'
      }
    ]
  },

  customCommands: {
    name: 'Custom Commands',
    description: 'Create custom commands',
    icon: '⚡',
    category: 'utility',
    enabled: true,
    fields: [
      {
        key: 'custom_commands_enabled',
        label: 'Enable Custom Commands',
        type: 'toggle',
        default: true,
        group: 'General'
      },
      {
        key: 'custom_commands_max_per_guild',
        label: 'Max Commands per Guild',
        type: 'number',
        default: 100,
        group: 'Limits'
      }
    ]
  }
};

function getModuleSchema(moduleName) {
  return MODULE_SCHEMAS[moduleName] || null;
}

function getAllModules() {
  return Object.entries(MODULE_SCHEMAS).map(([key, schema]) => ({
    key,
    ...schema
  }));
}

function getModuleField(moduleName, fieldKey) {
  const schema = getModuleSchema(moduleName);
  if (!schema) return null;
  return schema.fields.find(f => f.key === fieldKey);
}

module.exports = {
  MODULE_SCHEMAS,
  getModuleSchema,
  getAllModules,
  getModuleField
};
