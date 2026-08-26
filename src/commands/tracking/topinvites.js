const { SlashCommandBuilder } = require('discord.js');
const Command = require('../Command.js');
const RotiEmbed = require('../../utils/embed.js');
const botConfig = require('../../config.js');

class TopInvitesCommand extends Command {
  constructor() {
    super({
      name: 'topinvites',
      description: 'Display the server top inviters leaderboard',
      category: 'Tracking',
      aliases: ['invitelb', 'invitesleaderboard', 'topinv'],
      usage: 'topinvites',
      slashData: new SlashCommandBuilder()
        .setName('topinvites')
        .setDescription('Shows the top server inviters')
    });
  }

  async execute(ctx) {
    const guild = ctx.guild;
    const top = ctx.client.db.prepare(`
      SELECT user_id, regular, bonus, left, fake, (regular + bonus - left - fake) as total 
      FROM invites 
      WHERE guild_id = ? AND (regular + bonus - left - fake) > 0
      ORDER BY total DESC 
      LIMIT 10
    `).all(guild.id);

    if (top.length === 0) {
      return ctx.reply({ embeds: [RotiEmbed.info('Invite Leaderboard', 'No recorded invites on this server yet.')] });
    }

    const medals = ['🥇', '🥈', '🥉', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣', '🔟'];
    const list = top.map((u, i) => `${medals[i] || '▫️'} <@${u.user_id}> — **${u.total}** invites (\`${u.regular}\` reg, \`${u.bonus}\` bonus, \`${u.left}\` left)`).join('\n');

    const embed = new RotiEmbed()
      .setTitle(`🏆 Top Inviters: ${guild.name}`)
      .setDescription(list)
      .setColor(botConfig.colors.teal);

    return ctx.reply({ embeds: [embed] });
  }
}

module.exports = TopInvitesCommand;
