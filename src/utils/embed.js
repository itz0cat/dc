const { EmbedBuilder } = require('discord.js');
const botConfig = require('../config.js');

class RotiEmbed extends EmbedBuilder {
  constructor(data = {}) {
    super(data);
    if (!this.data.color) {
      this.setColor(botConfig.colors.primary); // Teal Blue by default
    }
    if (!this.data.footer) {
      this.setFooter({ text: botConfig.footerText });
    }
    this.setTimestamp();
  }

  static success(title, description) {
    return new RotiEmbed()
      .setColor(botConfig.colors.success)
      .setTitle(`${botConfig.emojis.success} ${title}`)
      .setDescription(description || null);
  }

  static error(title, description) {
    return new RotiEmbed()
      .setColor(botConfig.colors.error)
      .setTitle(`${botConfig.emojis.error} ${title}`)
      .setDescription(description || null);
  }

  static warning(title, description) {
    return new RotiEmbed()
      .setColor(botConfig.colors.warning)
      .setTitle(`${botConfig.emojis.warning} ${title}`)
      .setDescription(description || null);
  }

  static info(title, description) {
    return new RotiEmbed()
      .setColor(botConfig.colors.info)
      .setTitle(`${botConfig.emojis.info} ${title}`)
      .setDescription(description || null);
  }
}

module.exports = RotiEmbed;
