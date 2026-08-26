const { SlashCommandBuilder } = require('discord.js');
const Command = require('../Command.js');
const { parseDuration, formatDuration } = require('../../utils/time.js');

class SeekCommand extends Command {
  constructor() {
    super({
      name: 'seek',
      description: 'Seek to a specific timestamp in the current song',
      category: 'Music',
      aliases: ['forward', 'rewind', 'ff'],
      usage: 'seek <seconds / mm:ss>',
      slashData: new SlashCommandBuilder()
        .setName('seek')
        .setDescription('Seek to timestamp in song')
        .addStringOption(opt => opt.setName('time').setDescription('Timestamp (e.g. 1:30 or 90s)').setRequired(true))
    });
  }

  async execute(ctx, args) {
    const queue = ctx.client.music.getQueue(ctx.guild.id);
    if (!queue || !queue.current) return ctx.sendError('Not Playing', 'No music is currently playing.');

    const timeArg = ctx.isSlash ? ctx.raw.options.getString('time') : args[0];
    if (!timeArg) return ctx.sendError('Missing Time', 'Specify a time, e.g. `?seek 1:30` or `?forward 10s`.');

    let seconds = 0;
    if (timeArg.includes(':')) {
      const parts = timeArg.split(':').map(Number);
      if (parts.length === 2) seconds = parts[0] * 60 + parts[1];
      if (parts.length === 3) seconds = parts[0] * 3600 + parts[1] * 60 + parts[2];
    } else {
      seconds = parseInt(timeArg);
    }

    if (isNaN(seconds) || seconds < 0) return ctx.sendError('Invalid Time', 'Please provide a valid timestamp.');

    queue.startedAt = Date.now() - (seconds * 1000);
    return ctx.sendSuccess('Seek Position', `⏩ Seeked playback position to **${formatDuration(seconds * 1000)}**.`);
  }
}

module.exports = SeekCommand;
