const Discord = require('discord.js');
const {
  EmbedBuilder,
  PermissionsBitField,
  Guild,
  GuildMember,
  User,
  Message,
  Collection
} = Discord;

// Collection.prototype.array shim
if (!Collection.prototype.array) {
  Collection.prototype.array = function () {
    return [...this.values()];
  };
}

// Backwards-compatible MessageEmbed
class MessageEmbed extends EmbedBuilder {
  constructor(data) {
    if (data) {
      if (data.author && typeof data.author === 'string') {
        data = { ...data, author: { name: data.author } };
      }
      if (data.footer && typeof data.footer === 'string') {
        data = { ...data, footer: { text: data.footer } };
      }
      super(data);
    } else {
      super();
    }
  }

  addField(name, value, inline = false) {
    const safeName = (name !== null && name !== undefined && String(name).trim() !== '') ? String(name) : '\u200B';
    const safeValue = (value !== null && value !== undefined && String(value).trim() !== '') ? String(value) : '\u200B';
    return this.addFields({ name: safeName, value: safeValue, inline: Boolean(inline) });
  }

  setAuthor(name, iconURL, url) {
    if (typeof name === 'object' && name !== null) {
      return super.setAuthor(name);
    }
    const opts = { name: String(name || '') };
    if (iconURL) opts.iconURL = iconURL;
    if (url) opts.url = url;
    return super.setAuthor(opts);
  }

  setFooter(text, iconURL) {
    if (typeof text === 'object' && text !== null) {
      return super.setFooter(text);
    }
    const opts = { text: String(text || '') };
    if (iconURL) opts.iconURL = iconURL;
    return super.setFooter(opts);
  }

  attachFiles(files) {
    this.files = files;
    return this;
  }
}

// Attach to Discord export
Discord.MessageEmbed = MessageEmbed;

// Guild.me getter
if (!Object.getOwnPropertyDescriptor(Guild.prototype, 'me')) {
  Object.defineProperty(Guild.prototype, 'me', {
    get() {
      return this.members.me;
    },
    configurable: true
  });
}

// Guild.systemChannelID alias
if (!Object.getOwnPropertyDescriptor(Guild.prototype, 'systemChannelID')) {
  Object.defineProperty(Guild.prototype, 'systemChannelID', {
    get() {
      return this.systemChannelId;
    },
    configurable: true
  });
}

// GuildMember.hasPermission
if (!GuildMember.prototype.hasPermission) {
  GuildMember.prototype.hasPermission = function (perm, checkAdmin = true) {
    try {
      if (!this.permissions) return false;
      return this.permissions.has(perm, checkAdmin);
    } catch (e) {
      return false;
    }
  };
}

// GuildMember.displayHexColor default
if (!Object.getOwnPropertyDescriptor(GuildMember.prototype, 'displayHexColor')) {
  Object.defineProperty(GuildMember.prototype, 'displayHexColor', {
    get() {
      return this.displayColor ? `#${this.displayColor.toString(16).padStart(6, '0')}` : '#7289da';
    },
    configurable: true
  });
}

// User / Member displayAvatarURL compatibility
const origUserDisplayAvatarURL = User.prototype.displayAvatarURL;
User.prototype.displayAvatarURL = function (options) {
  try {
    return origUserDisplayAvatarURL.call(this, { forceStatic: false, ...(options || {}) });
  } catch (e) {
    return origUserDisplayAvatarURL.call(this);
  }
};

const origGuildIconURL = Guild.prototype.iconURL;
Guild.prototype.iconURL = function (options) {
  try {
    return origGuildIconURL.call(this, { forceStatic: false, ...(options || {}) });
  } catch (e) {
    return origGuildIconURL.call(this);
  }
};

// Channel send normalization helper
function normalizeSendArgs(content, options) {
  let payload = {};

  if (content && typeof content === 'object' && !(content instanceof String)) {
    if (content instanceof EmbedBuilder || content.data || (content.fields && !content.embeds)) {
      payload = { embeds: [content], ...(options || {}) };
    } else {
      payload = content;
    }
  } else if (typeof content === 'string') {
    payload.content = content;
    if (options) {
      if (options instanceof EmbedBuilder || options.data || (options.fields && !options.embeds)) {
        payload.embeds = [options];
      } else if (typeof options === 'object') {
        payload = { ...payload, ...options };
      }
    }
  } else {
    payload = options || {};
  }

  return payload;
}

// Patch TextBased Channels
const channelPrototypes = [
  Discord.TextChannel,
  Discord.DMChannel,
  Discord.NewsChannel,
  Discord.ThreadChannel
].filter(Boolean);

for (const proto of channelPrototypes) {
  if (proto && proto.prototype && proto.prototype.send) {
    const origSend = proto.prototype.send;
    proto.prototype.send = function (content, options) {
      const payload = normalizeSendArgs(content, options);
      return origSend.call(this, payload);
    };
  }
}

// Patch Message.edit
if (Message.prototype.edit) {
  const origEdit = Message.prototype.edit;
  Message.prototype.edit = function (content, options) {
    const payload = normalizeSendArgs(content, options);
    return origEdit.call(this, payload);
  };
}

// Discord.Permissions.FLAGS compatibility
if (!Discord.Permissions) {
  Discord.Permissions = PermissionsBitField;
}
if (!Discord.Permissions.FLAGS) {
  Discord.Permissions.FLAGS = PermissionsBitField.Flags;
}

module.exports = {
  MessageEmbed
};
