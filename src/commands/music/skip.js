const { SlashCommandBuilder } = require('discord.js');
const Command = require('../Command.js');
const RotiEmbed = require('../../utils/embed.js');
const botConfig = require('../../config.js');

class SkipCommand extends Command {
  constructor() {
    super({
      name: 'skip',
      description: 'Skip the current playing song to the next in queue',
      category: 'Music',
      aliases: ['s', 'next'],
      usage: 'skip',
      slashData: new SlashCommandBuilder()
        .setName('skip')
        .setDescription('Skip current song')
    });
  }

  async execute(ctx) {
    const queue = ctx.client.music.getQueue(ctx.guild.id);
    if (!queue || !queue.current) return ctx.sendError('Not Playing', 'No song is currently playing to skip.');

    const skippedSong = queue.current.title;
    ctx.client.music.handleSongEnd(ctx.guild.id);

    return ctx.sendSuccess('Song Skipped', `⏭️ Skipped **${skippedSong}**!`);
  }
}

module.exports = SkipCommand;
