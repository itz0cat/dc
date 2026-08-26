const RotiEmbed = require('../utils/embed.js');
const botConfig = require('../config.js');

module.exports = async (client, member) => {
  const guild = member.guild;
  const settings = client.db.getGuild(guild.id);

  // 1. Anti-Nuke: Anti-Bot Check
  if (member.user.bot) {
    const antinuke = client.db.prepare('SELECT * FROM antinuke_configs WHERE guild_id = ?').get(guild.id);
    if (antinuke && antinuke.enabled && antinuke.anti_bot) {
      const auditLogs = await guild.fetchAuditLogs({ type: 28, limit: 1 }).catch(() => null); // BOT_ADD
      const entry = auditLogs?.entries.first();
      const executor = entry?.executor;
      const whitelist = JSON.parse(antinuke.whitelist || '[]');

      if (executor && executor.id !== guild.ownerId && !whitelist.includes(executor.id)) {
        await member.kick('Anti-Nuke: Unauthorized bot addition').catch(() => {});
        if (antinuke.logs_channel_id) {
          const logChan = guild.channels.cache.get(antinuke.logs_channel_id);
          if (logChan) {
            logChan.send({
              embeds: [RotiEmbed.error('🛡️ Anti-Nuke Triggered: Unauthorized Bot Added', `**Bot:** <@${member.id}> (${member.user.tag})\n**Added By:** <@${executor.id}> (${executor.tag})\n**Action Taken:** Kicked unverified bot.`)]
            }).catch(() => {});
          }
        }
        return;
      }
    }
  }

  // 2. Falcon Invite Tracking
  let inviterUser = null;
  let inviterTotal = 0;
  try {
    const usedInvite = await client.inviteTracker.findUsedInvite(guild);
    if (usedInvite && usedInvite.inviter) {
      inviterUser = usedInvite.inviter;
      const isFake = (Date.now() - member.user.createdTimestamp) < (3 * 86400000); // Created < 3 days ago = fake

      // Update Inviter Record
      client.db.prepare(`
        INSERT INTO invites (guild_id, user_id, regular, fake, left, bonus)
        VALUES (?, ?, ?, ?, 0, 0)
        ON CONFLICT(guild_id, user_id) DO UPDATE SET
          regular = regular + ?,
          fake = fake + ?
      `).run(guild.id, inviterUser.id, isFake ? 0 : 1, isFake ? 1 : 0, isFake ? 0 : 1, isFake ? 1 : 0);

      // Record member join source
      client.db.prepare(`
        INSERT OR REPLACE INTO invite_members (guild_id, user_id, inviter_id, code, timestamp)
        VALUES (?, ?, ?, ?, ?)
      `).run(guild.id, member.id, inviterUser.id, usedInvite.code, Date.now());

      const invData = client.db.prepare('SELECT (regular + bonus - left - fake) as total FROM invites WHERE guild_id = ? AND user_id = ?').get(guild.id, inviterUser.id);
      inviterTotal = invData?.total || 1;

      // Check role rewards for inviter
      await client.inviteTracker.checkInviteRoles(guild, inviterUser.id, inviterTotal);
    }
  } catch (e) {
    client.logger.warn('Error in invite tracking:', e);
  }

  // 3. Welcome Message (with Falcon placeholders)
  if (settings.welcome_channel_id) {
    const welcomeChannel = guild.channels.cache.get(settings.welcome_channel_id);
    if (welcomeChannel) {
      let welcomeText = (settings.welcome_message || 'Welcome ?member to ?server! We now have ?size members.')
        .replace(/\?member|\{member\}/g, `<@${member.id}>`)
        .replace(/\?username|\{username\}/g, member.user.username)
        .replace(/\?tag|\{tag\}/g, member.user.tag)
        .replace(/\?server|\{server\}/g, guild.name)
        .replace(/\?size|\{size\}|\{count\}/g, guild.memberCount)
        .replace(/\{inviter\}/g, inviterUser ? `<@${inviterUser.id}>` : '*Unknown / Vanity*')
        .replace(/\{invites\}/g, inviterTotal);

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

  // 4. Sticky Roles Reassignment
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

  // 5. AutoRole Assignment
  const autoRoleId = client.db.prepare("SELECT role_id FROM button_roles WHERE guild_id = ? AND type = 'autorole'").pluck().get(guild.id);
  if (autoRoleId && guild.roles.cache.has(autoRoleId)) {
    await member.roles.add(autoRoleId, 'AutoRole on join').catch(() => {});
  }

  // 6. Member Join Log
  if (settings.log_channel_id) {
    const logChannel = guild.channels.cache.get(settings.log_channel_id);
    if (logChannel) {
      const joinEmbed = new RotiEmbed()
        .setTitle('📥 Member Joined')
        .setDescription(`<@${member.id}> (${member.user.tag})\nAccount created: <t:${Math.floor(member.user.createdTimestamp / 1000)}:R>\nInvited by: ${inviterUser ? `<@${inviterUser.id}> (${inviterTotal} invites)` : '*Vanity URL / Unknown*'}`)
        .setThumbnail(member.user.displayAvatarURL())
        .setColor(botConfig.colors.success);
      logChannel.send({ embeds: [joinEmbed] }).catch(() => {});
    }
  }
};
