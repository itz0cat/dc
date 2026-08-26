const { SlashCommandBuilder } = require('discord.js');
const Command = require('../Command.js');
const RotiEmbed = require('../../utils/embed.js');
const botConfig = require('../../config.js');

class StopCommand extends Command {
  constructor() {
    super({
      name: 'stop',
      description: 'Stop music playback, clear queue, and leave the voice channel',
      category: 'Music',
      aliases: ['disconnect', 'leave'],
      usage: 'stop',
      slashData: new SlashCommandBuilder()
        .setName('stop')
        .setDescription('Stop music and clear queue')
    });
  }

  async execute(ctx) {
    const queue = ctx.client.music.getQueue(ctx.guild.id);
    if (!queue) return ctx.sendError('Not Playing', 'There is no music currently playing.');

    ctx.client.music.destroyQueue(ctx.guild.id);
    return ctx.sendSuccess('Music Stopped', '⏹️ Playback stopped, queue cleared, and disconnected from voice channel.');
  }
}

module.exports = StopCommand;
