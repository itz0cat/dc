const RotiEmbed = require('../utils/embed.js');
const botConfig = require('../config.js');

module.exports = async (client, member) => {
  const guild = member.guild;

  // 1. Update Inviter Stats (Left count)
  try {
    const record = client.db.prepare('SELECT inviter_id FROM invite_members WHERE guild_id = ? AND user_id = ?').get(guild.id, member.id);
    if (record && record.inviter_id) {
      client.db.prepare(`
        UPDATE invites
        SET left = left + 1
        WHERE guild_id = ? AND user_id = ?
      `).run(guild.id, record.inviter_id);
    }
  } catch (e) {}

  // 2. Save Sticky Roles
  try {
    const roles = member.roles.cache.filter(r => r.id !== guild.id && !r.managed).map(r => r.id);
    if (roles.length > 0) {
      client.db.prepare(`
        INSERT OR REPLACE INTO sticky_roles (guild_id, user_id, roles)
        VALUES (?, ?, ?)
      `).run(guild.id, member.id, JSON.stringify(roles));
    }
  } catch (e) {}

  // 3. Leave Log
  const settings = client.db.getGuild(guild.id);
  if (settings.log_channel_id) {
    const logChannel = guild.channels.cache.get(settings.log_channel_id);
    if (logChannel) {
      const leaveEmbed = new RotiEmbed()
        .setTitle('📤 Member Left')
        .setDescription(`<@${member.id}> (${member.user.tag}) has left the server.\nMembers Remaining: \`${guild.memberCount}\``)
        .setThumbnail(member.user.displayAvatarURL())
        .setColor(botConfig.colors.error);
      logChannel.send({ embeds: [leaveEmbed] }).catch(() => {});
    }
  }
};
