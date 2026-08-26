const { ActivityType } = require('discord.js');
const { startGiveawayLoop } = require('../handlers/giveawayHandler.js');
const { startTemproleLoop } = require('../handlers/temproleHandler.js');
const { startReminderLoop } = require('../handlers/reminderHandler.js');
const botConfig = require('../config.js');

module.exports = async (client) => {
  client.logger.info(`✨ ${botConfig.name} is now online and ready!`);
  client.logger.info(`🛡️ Logged in as ${client.user.tag} (ID: ${client.user.id})`);
  client.logger.info(`🎨 Theme Color: Teal Blue (#00A896) | Creator: ${botConfig.creator}`);
  client.logger.info(`📊 Serving ${client.guilds.cache.size} server(s) and ${client.users.cache.size} user(s)`);

  // Register Global Slash Commands
  await client.registerSlashCommands();

  // Start background workers
  startGiveawayLoop(client);
  startTemproleLoop(client);
  startReminderLoop(client);

  // Initialize Falcon Invite Tracker
  await client.inviteTracker.init();

  // Rotating Status
  const activities = [
    { name: `?help | /help`, type: ActivityType.Playing },
    { name: `${client.guilds.cache.size} servers | Cat 🐱`, type: ActivityType.Watching },
    { name: `by ${botConfig.creator} • 111+ commands`, type: ActivityType.Listening },
    { name: `🎵 Music, Tickets & Giveaways`, type: ActivityType.Watching }
  ];

  let actIdx = 0;
  setInterval(() => {
    activities[1] = { name: `${client.guilds.cache.size} servers | Cat 🐱`, type: ActivityType.Watching };
    client.user.setPresence({
      activities: [activities[actIdx]],
      status: 'online'
    });
    actIdx = (actIdx + 1) % activities.length;
  }, 20000);
};
