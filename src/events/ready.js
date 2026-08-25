const { ActivityType } = require('discord.js');

module.exports = async (client) => {
  const activities = [
    { name: 'your commands', type: ActivityType.Listening }, 
    { name: `@${client.user ? client.user.username : 'Bot'}`, type: ActivityType.Listening },
    { name: `${client.guilds.cache.size} servers`, type: ActivityType.Watching },
    { name: `${client.users.cache.size} users`, type: ActivityType.Watching }
  ];

  // Update presence
  try {
    client.user.setPresence({
      status: 'online',
      activities: [activities[0]]
    });
  } catch (e) {
    client.logger.error(`Presence error: ${e.message}`);
  }

  let activityIndex = 1;

  // Update activity every 30 seconds
  setInterval(() => {
    activities[2] = { name: `${client.guilds.cache.size} servers`, type: ActivityType.Watching };
    activities[3] = { name: `${client.users.cache.size} users`, type: ActivityType.Watching };
    if (activityIndex >= activities.length) activityIndex = 0;
    try {
      client.user.setActivity(activities[activityIndex]);
    } catch (e) {}
    activityIndex++;
  }, 30000);

  client.logger.info('Updating database and scheduling jobs...');
  for (const guild of client.guilds.cache.values()) {
    try {
      // Fetch all guild members for accurate caching
      await guild.members.fetch().catch(() => {});

      /** FIND SETTINGS */ 
      const modLog = guild.channels.cache.find(c => 
        c.name.replace('-', '').replace('s', '') === 'modlog' || 
        c.name.replace('-', '').replace('s', '') === 'moderatorlog'
      );

      const adminRole = guild.roles.cache.find(r => r.name.toLowerCase() === 'admin' || r.name.toLowerCase() === 'administrator');
      const modRole = guild.roles.cache.find(r => r.name.toLowerCase() === 'mod' || r.name.toLowerCase() === 'moderator');
      const muteRole = guild.roles.cache.find(r => r.name.toLowerCase() === 'muted');
      const crownRole = guild.roles.cache.find(r => r.name === 'The Crown');

      const sysChannelId = guild.systemChannelId || (guild.channels.cache.first() ? guild.channels.cache.first().id : null);

      /** UPDATE TABLES */ 
      client.db.settings.insertRow.run(
        guild.id,
        guild.name,
        sysChannelId,
        sysChannelId,
        sysChannelId,
        sysChannelId,
        modLog ? modLog.id : null,
        adminRole ? adminRole.id : null,
        modRole ? modRole.id : null,
        muteRole ? muteRole.id : null,
        crownRole ? crownRole.id : null
      );
      
      // Update users table
      guild.members.cache.forEach(member => {
        client.db.users.insertRow.run(
          member.id, 
          member.user.username, 
          member.user.discriminator || '0',
          guild.id, 
          guild.name,
          member.joinedAt ? member.joinedAt.toString() : new Date().toString(),
          member.user.bot ? 1 : 0
        );
      });
      
      /** CHECK DATABASE */ 
      const currentMemberIds = client.db.users.selectCurrentMembers.all(guild.id).map(row => row.user_id);
      for (const id of currentMemberIds) {
        if (!guild.members.cache.has(id)) {
          client.db.users.updateCurrentMember.run(0, id, guild.id);
          client.db.users.wipeTotalPoints.run(id, guild.id);
        }
      }

      const missingMemberIds = client.db.users.selectMissingMembers.all(guild.id).map(row => row.user_id);
      for (const id of missingMemberIds) {
        if (guild.members.cache.has(id)) client.db.users.updateCurrentMember.run(1, id, guild.id);
      }

      /** VERIFICATION */ 
      const verifData = client.db.settings.selectVerification.get(guild.id);
      if (verifData && verifData.verification_channel_id && verifData.verification_message_id) {
        const verificationChannel = guild.channels.cache.get(verifData.verification_channel_id);
        if (verificationChannel && verificationChannel.viewable) {
          try {
            await verificationChannel.messages.fetch(verifData.verification_message_id);
          } catch (err) {
            client.logger.warn(`Verification message not found in guild ${guild.name}`);
          }
        }
      }

      /** CROWN ROLE */ 
      client.utils.scheduleCrown(client, guild);
    } catch (err) {
      client.logger.error(`Error initializing guild ${guild.name}: ${err.message}`);
    }
  }

  // Remove left guilds
  try {
    const dbGuilds = client.db.settings.selectGuilds.all();
    const activeGuildIds = new Set(client.guilds.cache.keys());
    const leftGuilds = dbGuilds.filter(g => !activeGuildIds.has(g.guild_id));
    for (const guild of leftGuilds) {
      client.db.settings.deleteGuild.run(guild.guild_id);
      client.db.users.deleteGuild.run(guild.guild_id);
      client.logger.info(`Cleaned up left guild: ${guild.guild_name}`);
    }
  } catch (err) {
    client.logger.error(`Error cleaning left guilds: ${err.message}`);
  }

  client.logger.info('Bot is now online and ready!');
  client.logger.info(`Running on ${client.guilds.cache.size} server(s)`);
};
