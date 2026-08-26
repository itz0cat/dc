const { SlashCommandBuilder } = require('discord.js');
const Command = require('../Command.js');

class SkipToCommand extends Command {
  constructor() {
    super({
      name: 'skipto',
      description: 'Skip directly to a specific song number in queue',
      category: 'Music',
      aliases: ['jump'],
      usage: 'skipto <position>',
      slashData: new SlashCommandBuilder()
        .setName('skipto')
        .setDescription('Skip to position in queue')
        .addIntegerOption(opt => opt.setName('position').setDescription('Queue position number').setMinValue(1).setRequired(true))
    });
  }

  async execute(ctx, args) {
    const queue = ctx.client.music.getQueue(ctx.guild.id);
    if (!queue || queue.songs.length === 0) return ctx.sendError('Queue Empty', 'There are no pending songs in the queue.');

    const pos = ctx.isSlash ? ctx.raw.options.getInteger('position') : parseInt(args[0]);
    if (isNaN(pos) || pos < 1 || pos > queue.songs.length) {
      return ctx.sendError('Invalid Position', `Please specify a number between 1 and ${queue.songs.length}.`);
    }

    // Splice songs before position
    queue.songs.splice(0, pos - 1);
    const next = queue.songs.shift();
    await ctx.client.music.play(queue, next);

    return ctx.sendSuccess('Jumped to Track', `⏭️ Jumped to **${next.title}**!`);
  }
}

module.exports = SkipToCommand;
