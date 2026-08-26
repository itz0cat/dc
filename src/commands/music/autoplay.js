const { SlashCommandBuilder } = require('discord.js');
const Command = require('../Command.js');

class AutoplayCommand extends Command {
  constructor() {
    super({
      name: 'autoplay',
      description: 'Toggle automatic playback of similar recommended songs when the queue ends',
      category: 'Music',
      aliases: ['ap'],
      usage: 'autoplay',
      slashData: new SlashCommandBuilder()
        .setName('autoplay')
        .setDescription('Toggle music autoplay')
    });
  }

  async execute(ctx) {
    const queue = ctx.client.music.getQueue(ctx.guild.id);
    if (!queue) return ctx.sendError('Not Playing', 'No music is currently playing.');

    queue.autoplay = !queue.autoplay;
    return ctx.sendSuccess('Autoplay Toggled', `📻 Autoplay is now **${queue.autoplay ? 'ENABLED (Will automatically discover similar songs)' : 'DISABLED'}**.`);
  }
}

module.exports = AutoplayCommand;
