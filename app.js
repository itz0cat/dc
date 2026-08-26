require('dotenv').config();
const path = require('path');
const fs = require('fs');
const RotiClient = require('./src/Client.js');
const logger = require('./src/utils/logger.js');
const botConfig = require('./src/config.js');

// Load config from json or env
let token = process.env.DISCORD_TOKEN;
let config = {};

const configPath = path.join(__dirname, 'config.json');
if (fs.existsSync(configPath)) {
  try {
    config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    if (!token && config.token) token = config.token;
  } catch (e) {
    logger.error('Failed to parse config.json:', e);
  }
}

if (!token || token === 'YOUR_DISCORD_BOT_TOKEN') {
  logger.error('No valid Discord bot token provided! Please check config.json or .env');
  process.exit(1);
}

logger.info(`Starting ${botConfig.name} v${botConfig.version}...`);
logger.info(`Creator: ${botConfig.creator} | Theme: Teal Blue (${botConfig.colorHex.primary})`);

const client = new RotiClient(token, {
  ownerId: config.ownerId || '1332523784493862912'
});

// Process Error Handling
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Promise Rejection:', { reason });
});

process.on('uncaughtException', (err) => {
  logger.error('Uncaught Exception:', { stack: err.stack, message: err.message });
});

client.start().catch(err => {
  logger.error(`Login failed: ${err.message}`, { stack: err.stack });
  process.exit(1);
});
