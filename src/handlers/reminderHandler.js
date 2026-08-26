const RotiEmbed = require('../utils/embed.js');
const botConfig = require('../config.js');

function startReminderLoop(client) {
  setInterval(async () => {
    try {
      const dueReminders = client.db.prepare('SELECT * FROM reminders WHERE remind_at <= ?').all(Date.now());
      for (const rem of dueReminders) {
        try {
          const user = await client.users.fetch(rem.user_id).catch(() => null);
          const channel = rem.channel_id ? (client.channels.cache.get(rem.channel_id) || await client.channels.fetch(rem.channel_id).catch(() => null)) : null;

          const embed = new RotiEmbed()
            .setTitle('⏰ Reminder Alert!')
            .setDescription(`**You asked me to remind you:**\n${rem.reason}`)
            .setColor(botConfig.colors.teal);

          if (channel) {
            await channel.send({ content: `<@${rem.user_id}>`, embeds: [embed] }).catch(async () => {
              if (user) await user.send({ embeds: [embed] }).catch(() => {});
            });
          } else if (user) {
            await user.send({ embeds: [embed] }).catch(() => {});
          }
        } catch (e) {}
        client.db.prepare('DELETE FROM reminders WHERE id = ?').run(rem.id);
      }
    } catch (err) {
      client.logger.error('Error in reminder loop:', err);
    }
  }, 10000);
}

module.exports = {
  startReminderLoop
};
