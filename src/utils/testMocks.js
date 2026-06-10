const { ChannelType, Collection } = require('discord.js');

const SAMPLE_GUILD_ID = '000000000000000001';
const SAMPLE_CHANNEL_ID = '000000000000000002';
const SAMPLE_USER_ID = '000000000000000003';
const SAMPLE_MEMBER_ID = '000000000000000004';
const SAMPLE_ROLE_ID = '000000000000000005';
const SAMPLE_BOT_ID = '000000000000000006';
const SAMPLE_VOICE_ID = '000000000000000007';

let replyCount = 0;
let deferCount = 0;

function makeMockMessage(overrides = {}) {
  const msg = {
    id: overrides.id || 'mock_msg_001',
    content: overrides.content || '!test',
    createdTimestamp: Date.now(),
    guild: overrides.guild || makeMockGuild(),
    channel: overrides.channel || makeMockChannel(),
    member: overrides.member || makeMockMember(),
    author: overrides.author || makeMockUser(),
    mentions: overrides.mentions || makeMockMentions(),
    reply: async (content) => {
      replyCount++;
      return makeMockMessage({ content: typeof content === 'string' ? content : JSON.stringify(content) });
    },
    edit: async (content) => makeMockMessage({ content: typeof content === 'string' ? content : JSON.stringify(content) }),
    delete: async (opts) => true,
    ...overrides
  };
  return msg;
}

function makeMockInteraction(overrides = {}) {
  let replied = false;
  let deferred = false;
  let replyContent = null;

  const interaction = {
    id: overrides.id || 'mock_interaction_001',
    commandName: overrides.commandName || 'test',
    createdTimestamp: Date.now(),
    customId: overrides.customId || '',
    guild: overrides.guild || makeMockGuild(),
    channel: overrides.channel || makeMockChannel(),
    member: overrides.member || makeMockMember(),
    user: overrides.user || makeMockUser(),
    options: overrides.options || makeMockOptions(),
    replied: false,
    deferred: false,
    isCommand: () => true,
    isButton: () => false,
    isModalSubmit: () => false,
    deferReply: async (opts) => {
      deferred = true;
      interaction.deferred = true;
      deferCount++;
    },
    editReply: async (content) => {
      replyContent = content;
    },
    reply: async (content) => {
      replied = true;
      interaction.replied = true;
      replyContent = content;
      replyCount++;
    },
    followUp: async (content) => {
      replyCount++;
    },
    ...overrides
  };

  Object.defineProperty(interaction, 'replied', {
    get: () => replied,
    enumerable: true
  });
  Object.defineProperty(interaction, 'deferred', {
    get: () => deferred,
    enumerable: true
  });

  return interaction;
}

function makeMockOptions(overrides = {}) {
  const stringValues = overrides.stringValues || {};
  const integerValues = overrides.integerValues || {};
  const userValue = overrides.userValue || makeMockUser();
  const channelValue = overrides.channelValue || makeMockChannel();
  const roleValue = overrides.roleValue || makeMockRole();
  const subcommand = overrides.subcommand || 'create';

  const options = {
    getUser: (name) => userValue,
    getString: (name) => stringValues[name] || 'test',
    getChannel: (name) => channelValue,
    getRole: (name) => roleValue,
    getInteger: (name) => integerValues[name] ?? 1,
    getSubcommand: () => subcommand,
    getSubcommandGroup: () => null,
    ...overrides
  };
  return options;
}

function makeMockGuild(overrides = {}) {
  const guildId = overrides.id || SAMPLE_GUILD_ID;
  const mockChannels = new Collection();
  const mockRoles = new Collection();
  const mockMembers = new Collection();

  const textChan = makeMockChannel({ id: SAMPLE_CHANNEL_ID, type: ChannelType.GuildText });
  const voiceChan = makeMockChannel({ id: SAMPLE_VOICE_ID, type: ChannelType.GuildVoice });
  mockChannels.set(SAMPLE_CHANNEL_ID, textChan);
  mockChannels.set(SAMPLE_VOICE_ID, voiceChan);

  const mockRole = makeMockRole({ id: SAMPLE_ROLE_ID, name: 'Test Role' });
  mockRoles.set(SAMPLE_ROLE_ID, mockRole);

  const mockMember = makeMockMember({ id: SAMPLE_MEMBER_ID });
  const botMember = makeMockMember({ id: SAMPLE_BOT_ID, user: makeMockUser({ id: SAMPLE_BOT_ID, username: 'Sanctum Bot', tag: 'Sanctum Bot#0000' }) });
  mockMembers.set(SAMPLE_MEMBER_ID, mockMember);
  mockMembers.set(SAMPLE_BOT_ID, botMember);

  return {
    id: guildId,
    name: overrides.name || 'Test Guild',
    iconURL: (opts) => 'https://cdn.discordapp.com/icons/0000/0000.png',
    ownerId: SAMPLE_USER_ID,
    memberCount: 42,
    createdTimestamp: Date.now() - 86400000 * 365,
    premiumTier: 1,
    channels: { cache: mockChannels },
    roles: { cache: mockRoles },
    members: {
      cache: mockMembers,
      me: botMember
    },
    ...overrides
  };
}

function makeMockMember(overrides = {}) {
  const memberUser = overrides.user || makeMockUser();
  return {
    id: overrides.id || SAMPLE_MEMBER_ID,
    user: memberUser,
    voice: {
      channel: makeMockChannel({ id: SAMPLE_VOICE_ID, type: ChannelType.GuildVoice }),
      channelId: SAMPLE_VOICE_ID
    },
    permissions: {
      has: (perm) => true
    },
    ban: async (options) => true,
    kick: async (reason) => true,
    timeout: async (ms, reason) => true,
    ...overrides
  };
}

function makeMockChannel(overrides = {}) {
  return {
    id: overrides.id || SAMPLE_CHANNEL_ID,
    name: overrides.name || 'test-channel',
    type: overrides.type ?? ChannelType.GuildText,
    send: async (content) => makeMockMessage({ content: typeof content === 'string' ? content : JSON.stringify(content) }),
    bulkDelete: async (amount, filterOld) => true,
    ...overrides
  };
}

function makeMockUser(overrides = {}) {
  return {
    id: overrides.id || SAMPLE_USER_ID,
    username: overrides.username || 'TestUser',
    tag: overrides.tag || 'TestUser#1234',
    displayAvatarURL: (opts) => 'https://cdn.discordapp.com/avatars/0000/0000.png',
    ...overrides
  };
}

function makeMockRole(overrides = {}) {
  return {
    id: overrides.id || SAMPLE_ROLE_ID,
    name: overrides.name || 'TestRole',
    ...overrides
  };
}

function makeMockMentions(overrides = {}) {
  const mockUser = makeMockUser();
  const mockMember = makeMockMember();
  const mockChannel = makeMockChannel();

  const usersCol = new Collection();
  usersCol.set(mockUser.id, mockUser);
  const membersCol = new Collection();
  membersCol.set(mockMember.id, mockMember);
  const channelsCol = new Collection();
  channelsCol.set(mockChannel.id, mockChannel);

  const mentions = {
    users: usersCol,
    members: membersCol,
    channels: channelsCol,
    first: () => null,
    ...overrides
  };

  mentions.users.first = () => mockUser;
  mentions.members.first = () => mockMember;
  mentions.channels.first = () => mockChannel;

  return mentions;
}

function makeMockEmbed() {
  return {
    setTitle: () => makeMockEmbed(),
    setDescription: () => makeMockEmbed(),
    setColor: () => makeMockEmbed(),
    setFooter: () => makeMockEmbed(),
    setTimestamp: () => makeMockEmbed(),
    setImage: () => makeMockEmbed(),
    setThumbnail: () => makeMockEmbed(),
    setAuthor: () => makeMockEmbed(),
    addFields: () => makeMockEmbed(),
  };
}

module.exports = {
  makeMockMessage,
  makeMockInteraction,
  makeMockOptions,
  makeMockGuild,
  makeMockMember,
  makeMockChannel,
  makeMockUser,
  makeMockRole,
  makeMockMentions,
  makeMockEmbed,
  SAMPLE_GUILD_ID,
  SAMPLE_CHANNEL_ID,
  SAMPLE_USER_ID,
  SAMPLE_MEMBER_ID,
  SAMPLE_ROLE_ID,
  SAMPLE_BOT_ID,
  SAMPLE_VOICE_ID
};
