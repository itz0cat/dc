const RotiEmbed = require('../utils/embed.js');
const botConfig = require('../config.js');

function startGiveawayLoop(client) {
  setInterval(async () => {
    try {
      const activeGiveaways = client.db.prepare("SELECT * FROM giveaways WHERE status = 'active' AND end_time <= ?").all(Date.now());
      for (const ga of activeGiveaways) {
        await endGiveaway(client, ga);
      }
    } catch (e) {
      client.logger.error('Error in giveaway loop:', e);
    }
  }, 5000);
}

async function endGiveaway(client, ga) {
  try {
    const channel = client.channels.cache.get(ga.channel_id) || await client.channels.fetch(ga.channel_id).catch(() => null);
    if (!channel) {
      client.db.prepare("UPDATE giveaways SET status = 'ended' WHERE id = ?").run(ga.id);
      return;
    }

    const message = await channel.messages.fetch(ga.message_id).catch(() => null);
    const entries = JSON.parse(ga.entries || '[]');
    const winnerCount = Math.max(1, ga.winner_count);

    let winners = [];
    if (entries.length > 0) {
      // Pick random winners
      const shuffled = [...entries].sort(() => 0.5 - Math.random());
      winners = shuffled.slice(0, winnerCount);
    }

    client.db.prepare("UPDATE giveaways SET status = 'ended', winners = ? WHERE id = ?").run(JSON.stringify(winners), ga.id);

    const winnerMentions = winners.length > 0 ? winners.map(id => `<@${id}>`).join(', ') : 'No valid entries!';

    const endEmbed = new RotiEmbed()
      .setTitle(`🎉 GIVEAWAY ENDED: ${ga.prize}`)
      .setDescription(`**Winner(s):** ${winnerMentions}\n**Hosted by:** <@${ga.host_id}>\n**Total Entries:** ${entries.length}`)
      .setColor(botConfig.colors.tealDark);

    if (message) {
      await message.edit({ embeds: [endEmbed], components: [] }).catch(() => {});
    }

    if (winners.length > 0) {
      channel.send({
        content: `🎉 Congratulations ${winnerMentions}! You won the **${ga.prize}**!`,
        embeds: [endEmbed]
      }).catch(() => {});
    } else {
      channel.send({
        content: `🎉 Giveaway for **${ga.prize}** ended, but there were no valid entries.`,
        embeds: [endEmbed]
      }).catch(() => {});
    }
  } catch (err) {
    client.logger.error(`Error ending giveaway ${ga.id}:`, err);
  }
}

module.exports = {
  startGiveawayLoop,
  endGiveaway
};
