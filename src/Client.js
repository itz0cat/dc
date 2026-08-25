require('./utils/shims.js');
const Discord = require('discord.js');
const { readdirSync, existsSync } = require('fs');
const { join, resolve } = require('path');
const AsciiTable = require('ascii-table');
const { fail } = require('./utils/emojis.json');

/**
 * Custom Client class
 * @extends Discord.Client
 */
class Client extends Discord.Client {

  /**
   * Create a new client
   * @param {Object} config 
   * @param {ClientOptions} options 
   */
  constructor(config, options = {}) {
    super(options);

    /**
     * Create logger
     */
    this.logger = require('./utils/logger.js');

    /**
     * Create database
     */
    this.db = require('./utils/db.js');

    /**
     * All possible command types
     * @type {Object}
     */
    this.types = {
      INFO: 'info',
      FUN: 'fun',
      COLOR: 'color',
      POINTS: 'points',
      MISC: 'misc',
      MOD: 'mod',
      ADMIN: 'admin',
      OWNER: 'owner'
    };

    /** 
     * Collection of bot commands
     * @type {Collection<string, Command>}
     */
    this.commands = new Discord.Collection();

    /** 
     * Collection of command aliases
     * @type {Collection<string, Command>}
     */
    this.aliases = new Discord.Collection();

    /** 
     * Array of trivia topics
     * @type {Array<string>}
     */
    this.topics = [];

    /** 
     * Login token
     * @type {string}
     */
    this.token = config.token || process.env.DISCORD_TOKEN;

    /** 
     * API keys
     * @type {Object}
     */
    this.apiKeys = config.apiKeys || {};

    /** 
     * Owner ID
     * @type {string}
     */
    this.ownerId = config.ownerId || process.env.OWNER_ID || '';

    /** 
     * Bug report channel ID
     * @type {string}
     */
    this.bugReportChannelId = config.bugReportChannelId || process.env.BUG_REPORT_CHANNEL_ID || '';

    /** 
     * Feedback channel ID
     * @type {string}
     */
    this.feedbackChannelId = config.feedbackChannelId || process.env.FEEDBACK_CHANNEL_ID || '';

    /** 
     * Server log channel ID
     * @type {string}
     */
    this.serverLogId = config.serverLogId || process.env.SERVER_LOG_ID || '';

    /** 
     * Utility functions
     * @type {Object}
     */
    this.utils = require('./utils/utils.js');

    this.logger.info('Initializing Client...');
  }

  /**
   * Loads all available events
   * @param {string} path 
   */
  loadEvents(path) {
    const fullPath = resolve(__basedir, path);
    if (!existsSync(fullPath)) return this;
    const files = readdirSync(fullPath).filter(f => f.endsWith('.js'));
    if (files.length === 0) {
      this.logger.warn('No events found');
      return this;
    }
    this.logger.info(`${files.length} event(s) found...`);
    files.forEach(f => {
      const eventName = f.substring(0, f.indexOf('.'));
      // In Discord.js v14: 'message' -> 'messageCreate'
      const discordEvent = eventName === 'message' ? 'messageCreate' : eventName;
      const event = require(resolve(__basedir, join(path, f)));
      this.on(discordEvent, event.bind(null, this));
      delete require.cache[require.resolve(resolve(__basedir, join(path, f)))];
      this.logger.info(`Loading event: ${eventName} -> ${discordEvent}`);
    });
    return this;
  }

  /**
   * Loads all available commands
   * @param {string} path 
   */
  loadCommands(path) {
    this.logger.info('Loading commands...');
    let table = new AsciiTable('Commands');
    table.setHeading('File', 'Aliases', 'Type', 'Status');
    const fullPath = resolve(__basedir, path);
    if (!existsSync(fullPath)) return this;
    
    readdirSync(fullPath).filter(f => !f.endsWith('.js')).forEach(dir => {
      const subDirPath = resolve(__basedir, join(path, dir));
      if (!existsSync(subDirPath)) return;
      const commands = readdirSync(subDirPath).filter(f => f.endsWith('.js'));
      commands.forEach(f => {
        try {
          const CommandClass = require(resolve(__basedir, join(path, dir, f)));
          const command = new CommandClass(this);
          if (command.name && !command.disabled) {
            this.commands.set(command.name, command);
            let aliases = '';
            if (command.aliases) {
              command.aliases.forEach(alias => {
                this.aliases.set(alias, command);
              });
              aliases = command.aliases.join(', ');
            }
            table.addRow(f, aliases, command.type, 'pass');
          } else {
            this.logger.warn(`${f} failed to load or is disabled`);
            table.addRow(f, '', '', 'fail');
          }
        } catch (err) {
          this.logger.error(`Error loading command ${f}: ${err.message}`);
          table.addRow(f, '', '', 'error');
        }
      });
    });
    this.logger.info(`\n${table.toString()}`);
    return this;
  }

  /**
   * Loads all available trivia topics
   * @param {string} path 
   */
  loadTopics(path) {
    const fullPath = resolve(__basedir, path);
    if (!existsSync(fullPath)) return this;
    const files = readdirSync(fullPath).filter(f => f.endsWith('.yml'));
    if (files.length === 0) {
      this.logger.warn('No topics found');
      return this;
    }
    this.logger.info(`${files.length} topic(s) found...`);
    files.forEach(f => {
      const topic = f.substring(0, f.indexOf('.'));
      this.topics.push(topic);
      this.logger.info(`Loading topic: ${topic}`);
    });
    return this;
  }

  /**
   * Checks if user is the bot owner
   * @param {User} user 
   */
  isOwner(user) {
    if (!user) return false;
    if (user.id === this.ownerId) return true;
    return false;
  }

  /**
   * Creates and sends system failure embed
   * @param {Guild} guild
   * @param {string} error
   * @param {string} errorMessage 
   */
  sendSystemErrorMessage(guild, error, errorMessage) {
    if (!guild) return;
    const systemChannelId = this.db.settings.selectSystemChannelId.pluck().get(guild.id);
    const systemChannel = guild.channels.cache.get(systemChannelId);
    const me = guild.members.me;

    if (
      !systemChannel || 
      !systemChannel.viewable || 
      !systemChannel.permissionsFor(me).has(['SendMessages', 'EmbedLinks'])
    ) return;

    const embed = new Discord.MessageEmbed()
      .setAuthor(this.user.tag, this.user.displayAvatarURL({ forceStatic: false }))
      .setTitle(`${fail} System Error: \`${error}\``)
      .setDescription(`\`\`\`diff\n- System Failure\n+ ${errorMessage}\`\`\``)
      .setTimestamp()
      .setColor(me ? me.displayHexColor : '#7289da');
    
    systemChannel.send({ embeds: [embed] }).catch(() => {});
  }
}

module.exports = Client;