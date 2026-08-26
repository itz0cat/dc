const RotiEmbed = require('../utils/embed.js');
const botConfig = require('../config.js');

module.exports = async (client, oldMessage, newMessage) => {
  if (!oldMessage.guild || oldMessage.author?.bot) return;
  if (oldMessage.content === newMessage.content) return;

  const settings = client.db.getGuild(oldMessage.guild.id);
  if (settings.log_channel_id) {
    const logChannel = oldMessage.guild.channels.cache.get(settings.log_channel_id);
    if (logChannel) {
      const editEmbed = new RotiEmbed()
        .setTitle('✏️ Message Edited')
        .setDescription(`**Author:** <@${oldMessage.author?.id}> (${oldMessage.author?.tag})\n**Channel:** <#${oldMessage.channel.id}>\n[Jump to Message](${newMessage.url})`)
        .addFields(
          { name: 'Before', value: oldMessage.content ? oldMessage.content.slice(0, 1000) : '*Empty*' },
          { name: 'After', value: newMessage.content ? newMessage.content.slice(0, 1000) : '*Empty*' }
        )
        .setColor(botConfig.colors.warning);
      logChannel.send({ embeds: [editEmbed] }).catch(() => {});
    }
  }
};
