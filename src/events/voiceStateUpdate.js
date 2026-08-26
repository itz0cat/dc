const { ChannelType, PermissionsBitField } = require('discord.js');

module.exports = async (client, oldState, newState) => {
  const guild = newState.guild || oldState.guild;
  const member = newState.member || oldState.member;
  if (!guild || !member || member.user.bot) return;

  const userId = member.id;
  const guildId = guild.id;

  // === 1. FALCON VOICE ACTIVITY TRACKING ===
  try {
    // User joined a voice channel
    if (!oldState.channelId && newState.channelId) {
      client.db.prepare(`
        INSERT INTO voice_stats (guild_id, user_id, total_time_ms, joined_at)
        VALUES (?, ?, 0, ?)
        ON CONFLICT(guild_id, user_id) DO UPDATE SET joined_at = ?
      `).run(guildId, userId, Date.now(), Date.now());
    }

    // User left voice channel
    if (oldState.channelId && !newState.channelId) {
      const stats = client.db.prepare('SELECT joined_at, total_time_ms FROM voice_stats WHERE guild_id = ? AND user_id = ?').get(guildId, userId);
      if (stats && stats.joined_at > 0) {
        const timeSpent = Date.now() - stats.joined_at;
        const newTotal = stats.total_time_ms + timeSpent;

        client.db.prepare(`
          UPDATE voice_stats
          SET total_time_ms = ?, joined_at = 0
          WHERE guild_id = ? AND user_id = ?
        `).run(newTotal, guildId, userId);

        // Check voice role rewards
        const rew = client.db.prepare('SELECT role_id FROM voice_roles WHERE guild_id = ? AND time_needed_ms <= ? ORDER BY time_needed_ms DESC LIMIT 1').get(guildId, newTotal);
        if (rew && rew.role_id && guild.roles.cache.has(rew.role_id) && !member.roles.cache.has(rew.role_id)) {
          await member.roles.add(rew.role_id, 'Voice activity milestone').catch(() => {});
        }
      }
    }
  } catch (e) {
    client.logger.warn('Error in voice activity tracking:', e);
  }

  // === 2. FALCON VOICEMASTER (JOIN-TO-CREATE) ===
  try {
    const vmConfig = client.db.prepare('SELECT * FROM voice_master_configs WHERE guild_id = ?').get(guildId);
    
    // User joined Hub channel -> create private temp voice
    if (vmConfig && vmConfig.hub_channel_id && newState.channelId === vmConfig.hub_channel_id) {
      const channelName = `🔊 ${member.user.username}'s Lounge`;

      const tempChannel = await guild.channels.create({
        name: channelName,
        type: ChannelType.GuildVoice,
        parent: vmConfig.category_id || newState.channel.parentId || null,
        userLimit: vmConfig.default_limit || 0,
        permissionOverwrites: [
          {
            id: member.id,
            allow: [
              PermissionsBitField.Flags.ManageChannels,
              PermissionsBitField.Flags.MoveMembers,
              PermissionsBitField.Flags.Connect,
              PermissionsBitField.Flags.Speak
            ]
          }
        ]
      });

      // Move member into new temp channel
      await member.voice.setChannel(tempChannel).catch(() => {});

      // Record in DB
      client.db.prepare(`
        INSERT INTO temp_voice_channels (guild_id, channel_id, owner_id, created_at)
        VALUES (?, ?, ?, ?)
      `).run(guildId, tempChannel.id, member.id, Date.now());
    }

    // Check if empty temp voice channel needs deletion
    if (oldState.channelId && oldState.channelId !== newState.channelId) {
      const isTemp = client.db.prepare('SELECT * FROM temp_voice_channels WHERE channel_id = ?').get(oldState.channelId);
      if (isTemp) {
        const oldChannel = guild.channels.cache.get(oldState.channelId);
        if (oldChannel && oldChannel.members.size === 0) {
          client.db.prepare('DELETE FROM temp_voice_channels WHERE channel_id = ?').run(oldState.channelId);
          await oldChannel.delete('VoiceMaster: Temp voice channel empty').catch(() => {});
        }
      }
    }
  } catch (e) {
    client.logger.warn('Error in VoiceMaster:', e);
  }
};
