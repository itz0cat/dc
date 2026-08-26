const { SlashCommandBuilder } = require('discord.js');
const Command = require('../Command.js');
const RotiEmbed = require('../../utils/embed.js');
const botConfig = require('../../config.js');

class PauseCommand extends Command {
  constructor() {
    super({
      name: 'pause',
      description: 'Pause the current song playback',
      category: 'Music',
      usage: 'pause',
      slashData: new SlashCommandBuilder()
        .setName('pause')
        .setDescription('Pause music playback')
    });
  }

  async execute(ctx) {
    const queue = ctx.client.music.getQueue(ctx.guild.id);
    if (!queue || !queue.current) return ctx.sendError('Not Playing', 'No music is currently playing.');

    if (queue.paused) return ctx.sendWarning('Already Paused', 'Music is already paused. Use `?resume` to continue.');

    queue.paused = true;
    queue.player.pause();
    return ctx.sendSuccess('Music Paused', '⏸️ Playback paused. Type `?resume` to continue listening.');
  }
}

module.exports = PauseCommand;
