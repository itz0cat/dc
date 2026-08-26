const RotiEmbed = require('../utils/embed.js');
const botConfig = require('../config.js');

module.exports = async (client, member) => {
  const guild = member.guild;
  const settings = client.db.getGuild(guild.id);

  // 1. Welcome Message
  if (settings.welcome_channel_id) {
    const welcomeChannel = guild.channels.cache.get(settings.welcome_channel_id);
    if (welcomeChannel) {
      let welcomeText = (settings.welcome_message || 'Welcome ?member to ?server! We now have ?size members.')
        .replace(/\?member/g, `<@${member.id}>`)
        .replace(/\?username/g, member.user.username)
        .replace(/\?tag/g, member.user.tag)
        .replace(/\?server/g, guild.name)
        .replace(/\?size/g, guild.memberCount);

      if (settings.welcome_embed) {
        const embed = new RotiEmbed()
          .setTitle(`👋 Welcome to ${guild.name}!`)
          .setDescription(welcomeText)
          .setThumbnail(member.user.displayAvatarURL({ forceStatic: false }))
          .setColor(botConfig.colors.teal);
        
        if (settings.welcome_image) {
          embed.setImage(settings.welcome_image);
        }

        welcomeChannel.send({ embeds: [embed] }).catch(() => {});
      } else {
        welcomeChannel.send({ content: welcomeText }).catch(() => {});
      }
    }
  }

  // 2. Sticky Roles Reassignment
  if (settings.sticky_roles_enabled) {
    const sticky = client.db.prepare('SELECT roles FROM sticky_roles WHERE guild_id = ? AND user_id = ?').get(guild.id, member.id);
    if (sticky && sticky.roles) {
      try {
        const roleIds = JSON.parse(sticky.roles);
        for (const rId of roleIds) {
          if (guild.roles.cache.has(rId)) {
            await member.roles.add(rId, 'Sticky role restored on rejoin').catch(() => {});
          }
        }
      } catch (e) {}
    }
  }

  // 3. AutoRole Assignment
  const autoRoleId = client.db.prepare("SELECT role_id FROM button_roles WHERE guild_id = ? AND type = 'autorole'").pluck().get(guild.id);
  if (autoRoleId && guild.roles.cache.has(autoRoleId)) {
    await member.roles.add(autoRoleId, 'AutoRole on join').catch(() => {});
  }

  // 4. Member Join Log
  if (settings.log_channel_id) {
    const logChannel = guild.channels.cache.get(settings.log_channel_id);
    if (logChannel) {
      const joinEmbed = new RotiEmbed()
        .setTitle('📥 Member Joined')
        .setDescription(`<@${member.id}> (${member.user.tag})\nAccount created: <t:${Math.floor(member.user.createdTimestamp / 1000)}:R>`)
        .setThumbnail(member.user.displayAvatarURL())
        .setColor(botConfig.colors.success);
      logChannel.send({ embeds: [joinEmbed] }).catch(() => {});
    }
  }
};
