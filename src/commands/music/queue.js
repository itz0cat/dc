const { SlashCommandBuilder } = require('discord.js');
const Command = require('../Command.js');
const RotiEmbed = require('../../utils/embed.js');
const botConfig = require('../../config.js');

class QueueCommand extends Command {
  constructor() {
    super({
      name: 'queue',
      description: 'Display all upcoming songs in the server music queue',
      category: 'Music',
      aliases: ['q'],
      usage: 'queue',
      slashData: new SlashCommandBuilder()
        .setName('queue')
        .setDescription('Shows the current music queue')
    });
  }

  async execute(ctx) {
    const queue = ctx.client.music.getQueue(ctx.guild.id);
    if (!queue || !queue.current) return ctx.sendError('Queue Empty', 'There are no songs currently in the queue.');

    let queueList = `**Now Playing:** [${queue.current.title}](${queue.current.url}) (\`${queue.current.durationStr}\`)\n\n__**Up Next:**__\n`;

    if (queue.songs.length === 0) {
      queueList += '*No upcoming tracks. Queue more songs using `?play <song>`!*';
    } else {
      queueList += queue.songs.slice(0, 10).map((s, i) => `**#${i + 1}** • [${s.title}](${s.url}) | \`${s.durationStr}\` (Requested by <@${s.requesterId}>)`).join('\n');
      if (queue.songs.length > 10) {
        queueList += `\n*... and ${queue.songs.length - 10} more songs*`;
      }
    }

    const embed = new RotiEmbed()
      .setTitle(`🎵 Music Queue: ${ctx.guild.name}`)
      .setDescription(queueList)
      .addFields(
        { name: 'Total Tracks', value: `\`${queue.songs.length + 1}\``, inline: true },
        { name: 'Loop Mode', value: `\`${queue.loop.toUpperCase()}\``, inline: true },
        { name: 'Volume', value: `\`${queue.volume}%\``, inline: true }
      )
      .setColor(botConfig.colors.teal);

    return ctx.reply({ embeds: [embed] });
  }
}

module.exports = QueueCommand;
