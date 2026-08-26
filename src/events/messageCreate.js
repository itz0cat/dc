const { PermissionsBitField } = require('discord.js');
const RotiEmbed = require('../utils/embed.js');
const botConfig = require('../config.js');
const { formatDuration } = require('../utils/time.js');

module.exports = async (client, message) => {
  if (!message.guild || message.author.bot) return;

  const guildId = message.guild.id;
  const channelId = message.channel.id;
  const authorId = message.author.id;

  // 0. Falcon Message Tracking
  try {
    client.db.prepare(`
      INSERT INTO message_stats (guild_id, user_id, daily_count, weekly_count, total_count, last_message)
      VALUES (?, ?, 1, 1, 1, ?)
      ON CONFLICT(guild_id, user_id) DO UPDATE SET
        daily_count = daily_count + 1,
        weekly_count = weekly_count + 1,
        total_count = total_count + 1,
        last_message = ?
    `).run(guildId, authorId, Date.now(), Date.now());

    // Check message role rewards
    const msgStats = client.db.prepare('SELECT total_count FROM message_stats WHERE guild_id = ? AND user_id = ?').get(guildId, authorId);
    if (msgStats) {
      const rew = client.db.prepare('SELECT role_id FROM message_roles WHERE guild_id = ? AND messages_needed <= ? ORDER BY messages_needed DESC LIMIT 1').get(guildId, msgStats.total_count);
      if (rew && rew.role_id && message.guild.roles.cache.has(rew.role_id) && !message.member.roles.cache.has(rew.role_id)) {
        await message.member.roles.add(rew.role_id, 'Message activity role milestone').catch(() => {});
      }
    }
  } catch (e) {}

  // 1. AFK Return Check
  const afkEntry = client.db.prepare('SELECT * FROM afk WHERE guild_id = ? AND user_id = ?').get(guildId, authorId);
  if (afkEntry) {
    client.db.prepare('DELETE FROM afk WHERE guild_id = ? AND user_id = ?').run(guildId, authorId);
    const duration = formatDuration(Date.now() - afkEntry.timestamp);
    message.reply({
      embeds: [
        RotiEmbed.info('Welcome Back!', `Welcome back <@${authorId}>! I have removed your AFK status.\nYou were away for **${duration}**.`)
      ]
    }).then(m => setTimeout(() => m.delete().catch(() => {}), 6000)).catch(() => {});
  }

  // 2. AFK Mention Check
  if (message.mentions.users.size > 0) {
    for (const [mentionedId, user] of message.mentions.users) {
      if (mentionedId === authorId) continue;
      const targetAfk = client.db.prepare('SELECT * FROM afk WHERE guild_id = ? AND user_id = ?').get(guildId, mentionedId);
      if (targetAfk) {
        const timeAgo = formatDuration(Date.now() - targetAfk.timestamp);
        message.reply({
          embeds: [
            RotiEmbed.warning('User is AFK', `**${user.username}** is currently AFK: **${targetAfk.reason}** (${timeAgo} ago)`)
          ]
        }).then(m => setTimeout(() => m.delete().catch(() => {}), 7000)).catch(() => {});
        break;
      }
    }
  }

  const guildSettings = client.db.getGuild(guildId);

  // 3. Media-Only Channel Check
  const mediaChannels = (guildSettings.media_only_channels || '').split(',').filter(Boolean);
  if (mediaChannels.includes(channelId)) {
    const hasMedia = message.attachments.size > 0 || /(https?:\/\/[^\s]+(?:\.png|\.jpg|\.jpeg|\.gif|\.webp|\.mp4|\.webm))/i.test(message.content);
    if (!hasMedia && !message.member.permissions.has(PermissionsBitField.Flags.ManageMessages)) {
      await message.delete().catch(() => {});
      return message.channel.send({
        content: `❌ <@${authorId}>, this channel is **Media-Only**. Only images, videos, and media files are allowed.`
      }).then(m => setTimeout(() => m.delete().catch(() => {}), 4000)).catch(() => {});
    }
  }

  // 4. Link-Only Channel Check
  const linkChannels = (guildSettings.link_only_channels || '').split(',').filter(Boolean);
  if (linkChannels.includes(channelId)) {
    const hasLink = /(https?:\/\/[^\s]+)/i.test(message.content);
    if (!hasLink && !message.member.permissions.has(PermissionsBitField.Flags.ManageMessages)) {
      await message.delete().catch(() => {});
      return message.channel.send({
        content: `❌ <@${authorId}>, this channel is **Link-Only**. Only messages containing valid links are allowed.`
      }).then(m => setTimeout(() => m.delete().catch(() => {}), 4000)).catch(() => {});
    }
  }

  // 5. AutoMod Checks
  const isMod = message.member.permissions.has(PermissionsBitField.Flags.ManageMessages) ||
    message.member.permissions.has(PermissionsBitField.Flags.Administrator);

  if (!isMod) {
    const automod = client.db.prepare('SELECT * FROM automod WHERE guild_id = ?').get(guildId) || {};
    
    // Anti-invites
    if (automod.anti_invites && /(discord\.(gg|io|me|li)\/.+|discordapp\.com\/invite\/.+|discord\.com\/invite\/.+)/i.test(message.content)) {
      await message.delete().catch(() => {});
      return message.channel.send({ content: `⚠️ <@${authorId}>, Discord invite links are not permitted here.` })
        .then(m => setTimeout(() => m.delete().catch(() => {}), 4000)).catch(() => {});
    }

    // Anti-links
    if (automod.anti_links && /(https?:\/\/[^\s]+)/i.test(message.content)) {
      await message.delete().catch(() => {});
      return message.channel.send({ content: `⚠️ <@${authorId}>, posting links is prohibited by AutoMod.` })
        .then(m => setTimeout(() => m.delete().catch(() => {}), 4000)).catch(() => {});
    }

    // Anti-caps
    if (automod.anti_caps && message.content.length >= 8) {
      const caps = message.content.replace(/[^A-Z]/g, '').length;
      if (caps / message.content.length > 0.7) {
        await message.delete().catch(() => {});
        return message.channel.send({ content: `⚠️ <@${authorId}>, excessive capital letters are not allowed.` })
          .then(m => setTimeout(() => m.delete().catch(() => {}), 4000)).catch(() => {});
      }
    }

    // Anti-massmention
    if (automod.anti_massmention && message.mentions.users.size >= 5) {
      await message.delete().catch(() => {});
      return message.channel.send({ content: `⚠️ <@${authorId}>, mass mentions are blocked by AutoMod.` })
        .then(m => setTimeout(() => m.delete().catch(() => {}), 4000)).catch(() => {});
    }

    // Banned Words
    const banwords = client.db.prepare('SELECT word FROM banwords WHERE guild_id = ?').pluck().all(guildId);
    for (const bw of banwords) {
      if (new RegExp(`\\b${bw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i').test(message.content)) {
        await message.delete().catch(() => {});
        return message.channel.send({ content: `⚠️ <@${authorId}>, your message contained a blacklisted word.` })
          .then(m => setTimeout(() => m.delete().catch(() => {}), 4000)).catch(() => {});
      }
    }
  }

  // 6. Highlights Check
  try {
    const highlights = client.db.prepare('SELECT * FROM highlights WHERE guild_id = ?').all(guildId);
    for (const hl of highlights) {
      if (hl.user_id === authorId) continue;
      const ignoredChannels = JSON.parse(hl.ignored_channels || '[]');
      const ignoredUsers = JSON.parse(hl.ignored_users || '[]');
      if (ignoredChannels.includes(channelId) || ignoredUsers.includes(authorId)) continue;

      if (new RegExp(`\\b${hl.word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i').test(message.content)) {
        const targetUser = client.users.cache.get(hl.user_id) || await client.users.fetch(hl.user_id).catch(() => null);
        if (targetUser) {
          const hlEmbed = new RotiEmbed()
            .setTitle(`🔔 Highlight Word Triggered: "${hl.word}"`)
            .setDescription(`**Server:** ${message.guild.name}\n**Channel:** <#${channelId}>\n**Author:** <@${authorId}> (${message.author.tag})\n\n**Message Preview:**\n${message.content.slice(0, 500)}`)
            .addFields({ name: 'Jump to Message', value: `[Click Here](${message.url})` })
            .setColor(botConfig.colors.teal);
          targetUser.send({ embeds: [hlEmbed] }).catch(() => {});
        }
      }
    }
  } catch (e) {}

  // 7. Custom Triggers Check
  const triggers = client.db.prepare('SELECT * FROM triggers WHERE guild_id = ?').all(guildId);
  for (const trg of triggers) {
    let matches = false;
    if (trg.wildcard) {
      matches = message.content.toLowerCase().includes(trg.name.toLowerCase());
    } else {
      matches = message.content.toLowerCase() === trg.name.toLowerCase();
    }
    if (matches) {
      return message.channel.send({ content: trg.response });
    }
  }

  // 8. Prefix Command Execution
  const prefix = guildSettings.prefix || botConfig.defaultPrefix;
  const prefixRegex = new RegExp(`^(<@!?${client.user.id}>|${prefix.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})\\s*`);

  if (!prefixRegex.test(message.content)) return;

  const [, match] = message.content.match(prefixRegex);
  const args = message.content.slice(match.length).trim().split(/ +/g);
  const cmdName = args.shift().toLowerCase();

  if (!cmdName) {
    const helpCmd = client.commands.get('help');
    if (helpCmd) {
      const ctx = helpCmd.createContext(message, []);
      return helpCmd.execute(ctx, []);
    }
  }

  const command = client.commands.get(cmdName) || client.aliases.get(cmdName);
  if (!command) return;

  // Permission Checks
  if (command.ownerOnly && message.author.id !== client.config.ownerId) {
    return message.reply({ embeds: [RotiEmbed.error('Access Denied', 'This command is restricted to the bot owner.')] });
  }

  if (command.userPermissions && command.userPermissions.length > 0) {
    const missing = message.member.permissions.missing(command.userPermissions);
    if (missing.length > 0 && !message.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
      return message.reply({
        embeds: [RotiEmbed.error('Missing Permissions', `You require the following permission(s):\n\`${missing.join(', ')}\``)]
      });
    }
  }

  // Create unified Context and execute
  const ctx = command.createContext(message, args);
  try {
    await command.execute(ctx, args);
  } catch (err) {
    client.logger.error(`Error executing command ${cmdName}:`, err);
    message.reply({ embeds: [RotiEmbed.error('Execution Error', `An error occurred: \`${err.message}\``)] }).catch(() => {});
  }
};
