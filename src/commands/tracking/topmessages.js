const { SlashCommandBuilder } = require('discord.js');
const Command = require('../Command.js');
const RotiEmbed = require('../../utils/embed.js');
const botConfig = require('../../config.js');

class TopMessagesCommand extends Command {
  constructor() {
    super({
      name: 'topmessages',
      description: 'Display the server top active chatters leaderboard',
      category: 'Tracking',
      aliases: ['messagelb', 'topmsgs', 'chatlb'],
      usage: 'topmessages',
      slashData: new SlashCommandBuilder()
        .setName('topmessages')
        .setDescription('Shows the top server chatters')
    });
  }

  async execute(ctx) {
    const guild = ctx.guild;
    const top = ctx.client.db.prepare(`
      SELECT user_id, total_count, daily_count, weekly_count 
      FROM message_stats 
      WHERE guild_id = ? AND total_count > 0 
      ORDER BY total_count DESC 
      LIMIT 10
    `).all(guild.id);

    if (top.length === 0) {
      return ctx.reply({ embeds: [RotiEmbed.info('Message Leaderboard', 'No message activity recorded yet.')] });
    }

    const medals = ['🥇', '🥈', '🥉', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣', '🔟'];
    const list = top.map((u, i) => `${medals[i] || '▫️'} <@${u.user_id}> — **${u.total_count.toLocaleString()}** msgs (\`${u.daily_count}\` today, \`${u.weekly_count}\` this week)`).join('\n');

    const embed = new RotiEmbed()
      .setTitle(`🏆 Top Active Chatters: ${guild.name}`)
      .setDescription(list)
      .setColor(botConfig.colors.teal);

    return ctx.reply({ embeds: [embed] });
  }
}

module.exports = TopMessagesCommand;
