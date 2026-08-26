const { SlashCommandBuilder } = require('discord.js');
const Command = require('../Command.js');
const RotiEmbed = require('../../utils/embed.js');
const botConfig = require('../../config.js');
const { formatDuration } = require('../../utils/time.js');

class TopVoiceCommand extends Command {
  constructor() {
    super({
      name: 'topvoice',
      description: 'Display the server top voice channel activity leaderboard',
      category: 'Tracking',
      aliases: ['voicelb', 'topvt', 'vlb'],
      usage: 'topvoice',
      slashData: new SlashCommandBuilder()
        .setName('topvoice')
        .setDescription('Shows the top voice active members')
    });
  }

  async execute(ctx) {
    const guild = ctx.guild;
    const top = ctx.client.db.prepare(`
      SELECT user_id, total_time_ms, joined_at 
      FROM voice_stats 
      WHERE guild_id = ? AND total_time_ms > 0 
      ORDER BY total_time_ms DESC 
      LIMIT 10
    `).all(guild.id);

    if (top.length === 0) {
      return ctx.reply({ embeds: [RotiEmbed.info('Voice Leaderboard', 'No voice channel activity recorded yet.')] });
    }

    const medals = ['🥇', '🥈', '🥉', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣', '🔟'];
    const list = top.map((u, i) => {
      let timeMs = u.total_time_ms;
      if (u.joined_at > 0) timeMs += (Date.now() - u.joined_at);
      return `${medals[i] || '▫️'} <@${u.user_id}> — **${formatDuration(timeMs)}**`;
    }).join('\n');

    const embed = new RotiEmbed()
      .setTitle(`🎙️ Top Voice Active Members: ${guild.name}`)
      .setDescription(list)
      .setColor(botConfig.colors.teal);

    return ctx.reply({ embeds: [embed] });
  }
}

module.exports = TopVoiceCommand;
