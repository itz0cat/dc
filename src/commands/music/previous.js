const { SlashCommandBuilder } = require('discord.js');
const Command = require('../Command.js');
const RotiEmbed = require('../../utils/embed.js');
const botConfig = require('../../config.js');

class PreviousCommand extends Command {
  constructor() {
    super({
      name: 'previous',
      description: 'Replay the previous song or display recent playback history',
      category: 'Music',
      aliases: ['history', 'prev'],
      usage: 'previous [history]',
      slashData: new SlashCommandBuilder()
        .setName('previous')
        .setDescription('Replay previous song or view history')
        .addSubcommand(s => s.setName('play').setDescription('Replay previous song'))
        .addSubcommand(s => s.setName('history').setDescription('View track history'))
    });
  }

  async execute(ctx, args) {
    const queue = ctx.client.music.getQueue(ctx.guild.id);
    const sub = ctx.isSlash ? ctx.raw.options.getSubcommand() : (args[0]?.toLowerCase() || 'play');

    if (!queue || !queue.history || queue.history.length === 0) {
      return ctx.sendError('No History', 'No previous songs have been played yet in this session.');
    }

    if (sub === 'history' || ctx.raw.content?.includes('history')) {
      const formatted = queue.history.slice(-10).reverse().map((s, i) => `**${i + 1}.** [${s.title}](${s.url}) \`[${s.durationStr || '3:30'}]\` • <@${s.requesterId}>`).join('\n');
      const embed = new RotiEmbed()
        .setTitle('📜 Playback History')
        .setDescription(formatted)
        .setColor(botConfig.colors.teal);
      return ctx.reply({ embeds: [embed] });
    }

    const prevSong = queue.history.pop();
    if (queue.current) queue.songs.unshift(queue.current);
    await ctx.client.music.play(queue, prevSong);
    return ctx.sendSuccess('Replaying Previous', `⏮️ Replaying [**${prevSong.title}**](${prevSong.url})!`);
  }
}

module.exports = PreviousCommand;
