const { SlashCommandBuilder } = require('discord.js');
const Command = require('../Command.js');
const RotiEmbed = require('../../utils/embed.js');
const botConfig = require('../../config.js');

class ClearqueueCommand extends Command {
  constructor() {
    super({
      name: 'clearqueue',
      description: 'Clear all upcoming tracks from the queue without stopping current playback',
      category: 'Music',
      aliases: ['cq'],
      usage: 'clearqueue',
      slashData: new SlashCommandBuilder()
        .setName('clearqueue')
        .setDescription('Clear upcoming songs from queue')
    });
  }

  async execute(ctx) {
    const queue = ctx.client.music.getQueue(ctx.guild.id);
    if (!queue || queue.songs.length === 0) return ctx.sendError('Queue Empty', 'There are no pending tracks in the queue.');

    const count = queue.songs.length;
    queue.songs = [];
    return ctx.sendSuccess('Queue Cleared', `🗑️ Removed **${count}** tracks from the queue.`);
  }
}

module.exports = ClearqueueCommand;
