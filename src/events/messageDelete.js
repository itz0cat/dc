const RotiEmbed = require('../utils/embed.js');
const botConfig = require('../config.js');

module.exports = async (client, message) => {
  if (!message.guild || message.author?.bot) return;

  // 1. Snipe Cache
  client.snipes.set(message.channel.id, {
    content: message.content || '[No text content]',
    author: message.author,
    image: message.attachments.first() ? message.attachments.first().proxyURL : null,
    timestamp: Date.now()
  });

  // 2. Logging
  const settings = client.db.getGuild(message.guild.id);
  if (settings.log_channel_id) {
    const logChannel = message.guild.channels.cache.get(settings.log_channel_id);
    if (logChannel) {
      const delEmbed = new RotiEmbed()
        .setTitle('🗑️ Message Deleted')
        .setDescription(`**Author:** <@${message.author?.id}> (${message.author?.tag})\n**Channel:** <#${message.channel.id}>\n\n**Content:**\n${message.content ? message.content.slice(0, 1000) : '*No text content*'}`)
        .setColor(botConfig.colors.error);
      logChannel.send({ embeds: [delEmbed] }).catch(() => {});
    }
  }
};
