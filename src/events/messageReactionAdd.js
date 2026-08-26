const RotiEmbed = require('../utils/embed.js');
const botConfig = require('../config.js');

module.exports = async (client, reaction, user) => {
  if (user.bot) return;

  // Fetch partials if needed
  if (reaction.partial) {
    try {
      await reaction.fetch();
    } catch (e) {
      return;
    }
  }

  const message = reaction.message;
  if (!message.guild) return;

  const guildId = message.guild.id;
  const settings = client.db.getGuild(guildId);

  // 1. Starboard
  if (reaction.emoji.name === '⭐' && settings.starboard_enabled && settings.starboard_channel_id) {
    const ignored = (settings.starboard_ignored_channels || '').split(',').filter(Boolean);
    if (!ignored.includes(message.channel.id)) {
      const starChannel = message.guild.channels.cache.get(settings.starboard_channel_id);
      const count = reaction.count;
      const threshold = settings.starboard_threshold || 3;

      if (starChannel && count >= threshold) {
        const starEmbed = new RotiEmbed()
          .setAuthor({ name: message.author.tag, iconURL: message.author.displayAvatarURL() })
          .setDescription(message.content || '[No text]')
          .addFields({ name: 'Original', value: `[Jump to Message](${message.url})` })
          .setColor(0xF1C40F);

        if (message.attachments.size > 0) {
          starEmbed.setImage(message.attachments.first().proxyURL);
        }

        // Check if already posted in starboard
        const existingMessages = await starChannel.messages.fetch({ limit: 50 }).catch(() => null);
        const existing = existingMessages?.find(m => m.embeds[0]?.fields?.some(f => f.value.includes(message.id)));

        if (existing) {
          existing.edit({ content: `⭐ **${count}** <#${message.channel.id}>`, embeds: [starEmbed] }).catch(() => {});
        } else {
          starChannel.send({ content: `⭐ **${count}** <#${message.channel.id}>`, embeds: [starEmbed] }).catch(() => {});
        }
      }
    }
  }

  // 2. Reaction Roles
  const rr = client.db.prepare('SELECT role_id FROM button_roles WHERE guild_id = ? AND message_id = ? AND emoji = ?')
    .pluck().get(guildId, message.id, reaction.emoji.name);
  
  if (rr) {
    const member = await message.guild.members.fetch(user.id).catch(() => null);
    if (member && !member.roles.cache.has(rr)) {
      await member.roles.add(rr, 'Reaction role').catch(() => {});
    }
  }
};
