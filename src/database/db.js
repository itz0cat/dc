const { DatabaseSync } = require('node:sqlite');
const path = require('path');
const fs = require('fs');

const dataDir = path.join(__dirname, '../../data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const dbFile = path.join(dataDir, 'roti.sqlite');
const dbInstance = new DatabaseSync(dbFile);

// Set Pragmas
dbInstance.exec('PRAGMA synchronous = 1;');
dbInstance.exec('PRAGMA journal_mode = wal;');

// Initialize Tables
dbInstance.exec(`
  CREATE TABLE IF NOT EXISTS guild_settings (
    guild_id TEXT PRIMARY KEY,
    prefix TEXT DEFAULT '?',
    mod_role_id TEXT,
    admin_role_id TEXT,
    log_channel_id TEXT,
    welcome_channel_id TEXT,
    welcome_message TEXT DEFAULT 'Welcome ?member to ?server! We now have ?size members.',
    welcome_embed INTEGER DEFAULT 1,
    welcome_image TEXT,
    starboard_channel_id TEXT,
    starboard_threshold INTEGER DEFAULT 3,
    starboard_enabled INTEGER DEFAULT 0,
    starboard_ignored_channels TEXT DEFAULT '',
    meme_channel_id TEXT,
    media_only_channels TEXT DEFAULT '',
    link_only_channels TEXT DEFAULT '',
    sticky_roles_enabled INTEGER DEFAULT 1
  );

  CREATE TABLE IF NOT EXISTS tickets (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    guild_id TEXT,
    channel_id TEXT,
    user_id TEXT,
    category TEXT DEFAULT "General",
    status TEXT DEFAULT "open",
    claimed_by TEXT,
    created_at INTEGER,
    closed_at INTEGER,
    close_reason TEXT
  );

  CREATE TABLE IF NOT EXISTS ticket_panels (
    guild_id TEXT PRIMARY KEY,
    channel_id TEXT,
    message_id TEXT,
    role_id TEXT,
    parent_category_id TEXT,
    claimed_category_id TEXT,
    log_channel_id TEXT,
    initial_message TEXT DEFAULT "Thank you for creating a ticket! Support staff will assist you shortly.",
    claimed_message TEXT DEFAULT "This ticket has been claimed by staff.",
    member_can_close INTEGER DEFAULT 1,
    categories TEXT DEFAULT "[]"
  );

  CREATE TABLE IF NOT EXISTS suggestions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    guild_id TEXT,
    user_id TEXT,
    channel_id TEXT,
    message_id TEXT,
    suggestion_text TEXT,
    image_url TEXT,
    anonymous INTEGER DEFAULT 0,
    status TEXT DEFAULT "pending",
    response_reason TEXT,
    responder_id TEXT,
    upvotes INTEGER DEFAULT 0,
    downvotes INTEGER DEFAULT 0,
    created_at INTEGER
  );

  CREATE TABLE IF NOT EXISTS suggestion_config (
    guild_id TEXT PRIMARY KEY,
    channel_id TEXT,
    threads_enabled INTEGER DEFAULT 1,
    resolve_buttons_enabled INTEGER DEFAULT 1,
    anonymous_enabled INTEGER DEFAULT 1
  );

  CREATE TABLE IF NOT EXISTS tags (
    guild_id TEXT,
    name TEXT,
    content TEXT,
    embed INTEGER DEFAULT 0,
    mod_only INTEGER DEFAULT 0,
    created_by TEXT,
    created_at INTEGER,
    PRIMARY KEY (guild_id, name)
  );

  CREATE TABLE IF NOT EXISTS triggers (
    guild_id TEXT,
    name TEXT,
    response TEXT,
    wildcard INTEGER DEFAULT 1,
    created_by TEXT,
    PRIMARY KEY (guild_id, name)
  );

  CREATE TABLE IF NOT EXISTS automod (
    guild_id TEXT PRIMARY KEY,
    anti_spam INTEGER DEFAULT 0,
    anti_invites INTEGER DEFAULT 0,
    anti_links INTEGER DEFAULT 0,
    anti_caps INTEGER DEFAULT 0,
    anti_massmention INTEGER DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS banwords (
    guild_id TEXT,
    word TEXT,
    PRIMARY KEY (guild_id, word)
  );

  CREATE TABLE IF NOT EXISTS giveaways (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    guild_id TEXT,
    channel_id TEXT,
    message_id TEXT,
    prize TEXT,
    winner_count INTEGER DEFAULT 1,
    host_id TEXT,
    end_time INTEGER,
    status TEXT DEFAULT "active",
    required_role_id TEXT,
    entries TEXT DEFAULT "[]",
    winners TEXT DEFAULT "[]"
  );

  CREATE TABLE IF NOT EXISTS highlights (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    guild_id TEXT,
    user_id TEXT,
    word TEXT,
    ignored_channels TEXT DEFAULT "[]",
    ignored_users TEXT DEFAULT "[]"
  );

  CREATE TABLE IF NOT EXISTS afk (
    guild_id TEXT,
    user_id TEXT,
    reason TEXT DEFAULT "AFK",
    timestamp INTEGER,
    PRIMARY KEY (guild_id, user_id)
  );

  CREATE TABLE IF NOT EXISTS notes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    guild_id TEXT,
    user_id TEXT,
    mod_id TEXT,
    note TEXT,
    created_at INTEGER
  );

  CREATE TABLE IF NOT EXISTS modlogs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    guild_id TEXT,
    case_id INTEGER,
    action TEXT,
    user_id TEXT,
    user_tag TEXT,
    mod_id TEXT,
    mod_tag TEXT,
    reason TEXT,
    duration INTEGER,
    created_at INTEGER
  );

  CREATE TABLE IF NOT EXISTS warnings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    guild_id TEXT,
    user_id TEXT,
    mod_id TEXT,
    reason TEXT,
    created_at INTEGER
  );

  CREATE TABLE IF NOT EXISTS sticky_roles (
    guild_id TEXT,
    user_id TEXT,
    roles TEXT DEFAULT "[]",
    PRIMARY KEY (guild_id, user_id)
  );

  CREATE TABLE IF NOT EXISTS button_roles (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    guild_id TEXT,
    channel_id TEXT,
    message_id TEXT,
    role_id TEXT,
    emoji TEXT,
    label TEXT,
    type TEXT DEFAULT "button"
  );

  CREATE TABLE IF NOT EXISTS temproles (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    guild_id TEXT,
    user_id TEXT,
    role_id TEXT,
    expires_at INTEGER
  );

  CREATE TABLE IF NOT EXISTS reminders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT,
    channel_id TEXT,
    reason TEXT,
    remind_at INTEGER
  );
`);

class StatementWrapper {
  constructor(stmt) {
    this.stmt = stmt;
    this._pluck = false;
  }

  pluck(enable = true) {
    this._pluck = enable;
    return this;
  }

  get(...args) {
    try {
      const row = this.stmt.get(...args);
      if (!row) return undefined;
      if (this._pluck) {
        const keys = Object.keys(row);
        return keys.length > 0 ? row[keys[0]] : undefined;
      }
      return { ...row };
    } catch (e) {
      return undefined;
    }
  }

  all(...args) {
    try {
      const rows = this.stmt.all(...args);
      if (!rows) return [];
      if (this._pluck) {
        return rows.map(r => {
          const keys = Object.keys(r);
          return keys.length > 0 ? r[keys[0]] : undefined;
        });
      }
      return rows.map(r => ({ ...r }));
    } catch (e) {
      return [];
    }
  }

  run(...args) {
    return this.stmt.run(...args);
  }
}

class DatabaseHelper {
  constructor(db) {
    this.db = db;
  }

  prepare(sql) {
    const stmt = this.db.prepare(sql);
    return new StatementWrapper(stmt);
  }

  // Guild Settings
  getGuild(guildId) {
    let guild = this.prepare('SELECT * FROM guild_settings WHERE guild_id = ?').get(guildId);
    if (!guild) {
      this.prepare('INSERT OR IGNORE INTO guild_settings (guild_id) VALUES (?)').run(guildId);
      guild = this.prepare('SELECT * FROM guild_settings WHERE guild_id = ?').get(guildId);
    }
    return guild;
  }

  updateGuild(guildId, key, value) {
    this.getGuild(guildId);
    return this.prepare(`UPDATE guild_settings SET ${key} = ? WHERE guild_id = ?`).run(value, guildId);
  }

  getPrefix(guildId) {
    if (!guildId) return '?';
    const res = this.prepare('SELECT prefix FROM guild_settings WHERE guild_id = ?').pluck().get(guildId);
    return res || '?';
  }

  // Case Number
  getNextCaseId(guildId) {
    const res = this.prepare('SELECT MAX(case_id) FROM modlogs WHERE guild_id = ?').pluck().get(guildId);
    return (res || 0) + 1;
  }

  // Mod Logs
  addModLog(guildId, action, userId, userTag, modId, modTag, reason, duration = null) {
    const caseId = this.getNextCaseId(guildId);
    this.prepare(`
      INSERT INTO modlogs (guild_id, case_id, action, user_id, user_tag, mod_id, mod_tag, reason, duration, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(guildId, caseId, action, userId, userTag, modId, modTag, reason, duration, Date.now());
    return caseId;
  }
}

const db = new DatabaseHelper(dbInstance);

module.exports = db;
