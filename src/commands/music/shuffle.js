const { SlashCommandBuilder } = require('discord.js');
const Command = require('../Command.js');
const RotiEmbed = require('../../utils/embed.js');
const botConfig = require('../../config.js');

class ShuffleCommand extends Command {
  constructor() {
    super({
      name: 'shuffle',
      description: 'Randomize and shuffle the current song queue',
      category: 'Music',
      usage: 'shuffle',
      slashData: new SlashCommandBuilder()
        .setName('shuffle')
        .setDescription('Shuffle the music queue')
    });
  }

  async execute(ctx) {
    const queue = ctx.client.music.getQueue(ctx.guild.id);
    if (!queue || queue.songs.length < 2) {
      return ctx.sendError('Cannot Shuffle', 'You need at least 2 songs in the queue to shuffle.');
    }

    queue.songs.sort(() => Math.random() - 0.5);
    return ctx.sendSuccess('Queue Shuffled', `🔀 Shuffled **${queue.songs.length}** songs in queue!`);
  }
}

module.exports = ShuffleCommand;
