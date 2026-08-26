const { SlashCommandBuilder } = require('discord.js');
const Command = require('../Command.js');
const botConfig = require('../../config.js');

class ReplayCommand extends Command {
  constructor() {
    super({
      name: 'replay',
      description: 'Restart and replay the current playing song from the beginning',
      category: 'Music',
      aliases: ['restart', 'loopcurrent'],
      usage: 'replay',
      slashData: new SlashCommandBuilder()
        .setName('replay')
        .setDescription('Replay current song from start')
    });
  }

  async execute(ctx) {
    const queue = ctx.client.music.getQueue(ctx.guild.id);
    if (!queue || !queue.current) return ctx.sendError('Not Playing', 'No music is currently playing.');

    await ctx.client.music.play(queue, queue.current);
    return ctx.sendSuccess('Song Replayed', `🔄 Replaying **${queue.current.title}** from the beginning!`);
  }
}

module.exports = ReplayCommand;
