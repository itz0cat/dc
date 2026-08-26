const { SlashCommandBuilder } = require('discord.js');
const Command = require('../Command.js');
const RotiEmbed = require('../../utils/embed.js');
const botConfig = require('../../config.js');
const { formatDuration } = require('../../utils/time.js');

class NowplayingCommand extends Command {
  constructor() {
    super({
      name: 'nowplaying',
      description: 'Display the current playing song with visual progress bar and details',
      category: 'Music',
      aliases: ['np', 'current'],
      usage: 'nowplaying',
      slashData: new SlashCommandBuilder()
        .setName('nowplaying')
        .setDescription('Shows the currently playing song')
    });
  }

  async execute(ctx) {
    const queue = ctx.client.music.getQueue(ctx.guild.id);
    if (!queue || !queue.current) return ctx.sendError('Not Playing', 'No music is currently playing.');

    const song = queue.current;
    const elapsedMs = Date.now() - queue.startedAt;
    const totalMs = song.durationMs || 210000;

    const currentFormatted = formatDuration(elapsedMs);
    const totalFormatted = song.durationStr || '3:30';
    const progressBar = ctx.client.music.getProgressBar(elapsedMs, totalMs, 14);

    const embed = new RotiEmbed()
      .setTitle('🎵 Now Playing')
      .setDescription(`[**${song.title}**](${song.url})\n\n\`${progressBar}\`\n\`[ ${currentFormatted} / ${totalFormatted} ]\``)
      .setThumbnail(song.thumbnail)
      .addFields(
        { name: 'Requested By', value: `<@${song.requesterId}>`, inline: true },
        { name: 'Volume', value: `\`${queue.volume}%\``, inline: true },
        { name: 'Loop', value: `\`${queue.loop.toUpperCase()}\``, inline: true }
      )
      .setColor(botConfig.colors.teal);

    return ctx.reply({ embeds: [embed] });
  }
}

module.exports = NowplayingCommand;
