const {
  Client: DiscordClient,
  Collection,
  GatewayIntentBits,
  Partials,
  REST,
  Routes
} = require('discord.js');
const fs = require('fs');
const path = require('path');
const db = require('./database/db.js');
const logger = require('./utils/logger.js');
const botConfig = require('./config.js');

class RotiClient extends DiscordClient {
  constructor(token, options = {}) {
    super({
      intents: [
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
      ],
      partials: [
        Partials.User,
        Partials.Channel,
        Partials.GuildMember,
        Partials.Message,
        Partials.Reaction
      ],
      ...options
    });

    this.token = token;
    this.db = db;
    this.logger = logger;
    this.config = botConfig;
    this.commands = new Collection();
    this.aliases = new Collection();
    this.slashCommands = [];
    this.snipes = new Collection(); // Channel ID -> last deleted message
    
    const MusicManager = require('./music/MusicManager.js');
    this.music = new MusicManager(this);
  }

  loadCommands(dir = path.join(__dirname, 'commands')) {
    this.logger.info('Loading R.O.T.I commands...');
    const categories = fs.readdirSync(dir).filter(f => fs.statSync(path.join(dir, f)).isDirectory());

    for (const category of categories) {
      const categoryPath = path.join(dir, category);
      const files = fs.readdirSync(categoryPath).filter(f => f.endsWith('.js'));

      for (const file of files) {
        try {
          const CommandClass = require(path.join(categoryPath, file));
          const command = new CommandClass();
          command.category = category.charAt(0).toUpperCase() + category.slice(1);
          
          this.commands.set(command.name, command);

          if (command.aliases && Array.isArray(command.aliases)) {
            for (const alias of command.aliases) {
              this.aliases.set(alias, command);
            }
          }

          if (command.slashData) {
            this.slashCommands.push(
              typeof command.slashData.toJSON === 'function' ? command.slashData.toJSON() : command.slashData
            );
          }

          this.logger.info(`Loaded command: ${command.name} [${command.category}]`);
        } catch (err) {
          this.logger.error(`Failed to load command ${file}: ${err.message}`, { stack: err.stack });
        }
      }
    }
    this.logger.info(`Total commands loaded: ${this.commands.size} (${this.aliases.size} aliases)`);
    return this;
  }

  loadEvents(dir = path.join(__dirname, 'events')) {
    this.logger.info('Loading R.O.T.I events...');
    if (!fs.existsSync(dir)) return this;
    const files = fs.readdirSync(dir).filter(f => f.endsWith('.js'));

    for (const file of files) {
      try {
        const eventName = file.split('.')[0];
        const eventHandler = require(path.join(dir, file));
        this.on(eventName, eventHandler.bind(null, this));
        this.logger.info(`Loaded event: ${eventName}`);
      } catch (err) {
        this.logger.error(`Failed to load event ${file}: ${err.message}`, { stack: err.stack });
      }
    }
    return this;
  }

  async registerSlashCommands() {
    if (!this.token) return;
    const rest = new REST({ version: '10' }).setToken(this.token);

    try {
      this.logger.info(`Registering ${Math.min(100, this.slashCommands.length)} Global Slash commands with Discord...`);
      // Discord REST API hard limit is 100 top-level slash commands per application
      const commandsToRegister = this.slashCommands.slice(0, 100);
      await rest.put(
        Routes.applicationCommands(this.user.id),
        { body: commandsToRegister }
      );
      this.logger.info('✅ Successfully registered Global Slash commands with Discord Gateway!');
    } catch (err) {
      this.logger.error('Failed to register global slash commands:', err);
    }
  }

  start() {
    this.loadEvents();
    this.loadCommands();
    return this.login(this.token);
  }
}

module.exports = RotiClient;
