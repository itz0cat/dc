const { SlashCommandBuilder } = require('discord.js');
const Command = require('../Command.js');

class RemoveCommand extends Command {
  constructor() {
    super({
      name: 'remove',
      description: 'Remove songs, clear duplicates, bump tracks, or clean up songs by departed users',
      category: 'Music',
      aliases: ['bump', 'removedupes', 'leavecleanup'],
      usage: 'remove <position / dupes / bump / user>',
      slashData: new SlashCommandBuilder()
        .setName('remove')
        .setDescription('Remove songs or duplicates from queue')
        .addSubcommand(s => s.setName('track').setDescription('Remove track by position').addIntegerOption(o => o.setName('position').setDescription('Queue number').setRequired(true)))
        .addSubcommand(s => s.setName('dupes').setDescription('Remove duplicate songs from queue'))
        .addSubcommand(s => s.setName('bump').setDescription('Move track to position 1').addIntegerOption(o => o.setName('position').setDescription('Queue number').setRequired(true)))
    });
  }

  async execute(ctx, args) {
    const queue = ctx.client.music.getQueue(ctx.guild.id);
    if (!queue || queue.songs.length === 0) return ctx.sendError('Queue Empty', 'There are no songs in the queue to remove.');

    const sub = ctx.isSlash ? ctx.raw.options.getSubcommand() : (args[0]?.toLowerCase() || '1');

    if (sub === 'dupes' || ctx.raw.content?.includes('removedupes')) {
      const seen = new Set();
      const initialCount = queue.songs.length;
      queue.songs = queue.songs.filter(s => {
        if (seen.has(s.url)) return false;
        seen.add(s.url);
        return true;
      });
      const removedCount = initialCount - queue.songs.length;
      return ctx.sendSuccess('Duplicates Removed', `🧹 Removed **${removedCount}** duplicate track(s) from the queue.`);
    }

    if (sub === 'bump' || ctx.raw.content?.includes('bump')) {
      const pos = ctx.isSlash ? ctx.raw.options.getInteger('position') : parseInt(args[1] || args[0]);
      if (isNaN(pos) || pos < 1 || pos > queue.songs.length) return ctx.sendError('Invalid Position', `Enter a number between 1 and ${queue.songs.length}.`);

      const bumped = queue.songs.splice(pos - 1, 1)[0];
      queue.songs.unshift(bumped);
      return ctx.sendSuccess('Track Bumped', `🚀 Bumped [**${bumped.title}**](${bumped.url}) to position **#1**!`);
    }

    // Default remove by index
    const pos = ctx.isSlash ? ctx.raw.options.getInteger('position') : parseInt(args[0]);
    if (isNaN(pos) || pos < 1 || pos > queue.songs.length) return ctx.sendError('Invalid Position', `Enter a number between 1 and ${queue.songs.length}.`);

    const removed = queue.songs.splice(pos - 1, 1)[0];
    return ctx.sendSuccess('Track Removed', `🗑️ Removed [**${removed.title}**](${removed.url}) from position **#${pos}**.`);
  }
}

module.exports = RemoveCommand;
