const { SlashCommandBuilder } = require('discord.js');
const Command = require('../Command.js');
const RotiEmbed = require('../../utils/embed.js');
const botConfig = require('../../config.js');

class ResumeCommand extends Command {
  constructor() {
    super({
      name: 'resume',
      description: 'Resume paused music playback',
      category: 'Music',
      aliases: ['unpause'],
      usage: 'resume',
      slashData: new SlashCommandBuilder()
        .setName('resume')
        .setDescription('Resume music playback')
    });
  }

  async execute(ctx) {
    const queue = ctx.client.music.getQueue(ctx.guild.id);
    if (!queue || !queue.current) return ctx.sendError('Not Playing', 'No music is currently paused.');

    if (!queue.paused) return ctx.sendWarning('Not Paused', 'Music is already playing.');

    queue.paused = false;
    queue.player.unpause();
    return ctx.sendSuccess('Music Resumed', '▶️ Playback resumed!');
  }
}

module.exports = ResumeCommand;
