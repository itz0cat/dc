require('dotenv').config();
require('./src/utils/shims.js');
const fs = require('fs');
const path = require('path');
const Client = require('./src/Client.js');
const { GatewayIntentBits, Partials } = require('discord.js');

global.__basedir = __dirname;

// Load config
let config = {};
const configPath = path.join(__dirname, 'config.json');
if (fs.existsSync(configPath)) {
  try {
    config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
  } catch (e) {
    console.error('Failed to parse config.json:', e);
  }
}

// Environment variables fallback
config.token = config.token || process.env.DISCORD_TOKEN;
config.ownerId = config.ownerId || process.env.OWNER_ID || '';
config.bugReportChannelId = config.bugReportChannelId || process.env.BUG_REPORT_CHANNEL_ID || '';
config.feedbackChannelId = config.feedbackChannelId || process.env.FEEDBACK_CHANNEL_ID || '';
config.serverLogId = config.serverLogId || process.env.SERVER_LOG_ID || '';
config.apiKeys = config.apiKeys || {
  catApi: process.env.CAT_API_KEY || '',
  googleApi: process.env.GOOGLE_API_KEY || ''
};

// Client setup with full Discord.js v14 intents
const intents = [
  GatewayIntentBits.Guilds,
  GatewayIntentBits.GuildMembers,
  GatewayIntentBits.GuildModeration,
  GatewayIntentBits.GuildEmojisAndStickers,
  GatewayIntentBits.GuildIntegrations,
  GatewayIntentBits.GuildWebhooks,
  GatewayIntentBits.GuildInvites,
  GatewayIntentBits.GuildVoiceStates,
  GatewayIntentBits.GuildPresences,
  GatewayIntentBits.GuildMessages,
  GatewayIntentBits.GuildMessageReactions,
  GatewayIntentBits.MessageContent,
  GatewayIntentBits.DirectMessages,
  GatewayIntentBits.DirectMessageReactions
];

const partials = [
  Partials.User,
  Partials.Channel,
  Partials.GuildMember,
  Partials.Message,
  Partials.Reaction
];

const client = new Client(config, {
  intents,
  partials
});

// Initialize client
function init() {
  client.loadEvents('./src/events');
  client.loadCommands('./src/commands');
  client.loadTopics('./data/trivia');
  
  if (!client.token) {
    client.logger.error('No Discord token provided! Please check your config.json or .env file.');
    process.exit(1);
  }

  client.login(client.token).catch(err => {
    client.logger.error(`Failed to login: ${err.message}`);
  });
}

init();

process.on('unhandledRejection', err => {
  if (client && client.logger) {
    client.logger.error(err);
  } else {
    console.error('Unhandled Rejection:', err);
  }
});

process.on('uncaughtException', err => {
  if (client && client.logger) {
    client.logger.error(err);
  } else {
    console.error('Uncaught Exception:', err);
  }
});
