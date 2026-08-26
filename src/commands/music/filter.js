const { SlashCommandBuilder } = require('discord.js');
const Command = require('../Command.js');
const botConfig = require('../../config.js');

class FilterCommand extends Command {
  constructor() {
    super({
      name: 'filter',
      description: 'Apply high quality audio filters (8d, nightcore, lofi, bassboost, slowed, karaoke, reset)',
      category: 'Music',
      aliases: ['8d', 'nightcore', 'bassboost', 'lofi', 'slowed', 'karaoke', 'resetfilter', 'daycore', 'chipmunk'],
      usage: 'filter <8d/nightcore/lofi/bassboost/slowed/reset>',
      slashData: new SlashCommandBuilder()
        .setName('filter')
        .setDescription('Apply audio filters')
        .addStringOption(opt => opt.setName('type').setDescription('Filter type').addChoices(
          { name: '🎧 8D Audio', value: '8d' },
          { name: '⚡ Nightcore', value: 'nightcore' },
          { name: '☕ Lofi Chill', value: 'lofi' },
          { name: '🔊 Bassboost', value: 'bassboost' },
          { name: '🌙 Slowed + Reverb', value: 'slowed' },
          { name: '🎤 Karaoke', value: 'karaoke' },
          { name: '🔄 Reset All Filters', value: 'reset' }
        ))
    });
  }

  async execute(ctx, args) {
    const queue = ctx.client.music.getQueue(ctx.guild.id);
    if (!queue || !queue.current) return ctx.sendError('Not Playing', 'No music is currently playing.');

    const filterName = ctx.isSlash ? (ctx.raw.options.getString('type') || 'reset') : (args[0]?.toLowerCase() || ctx.raw.content?.slice(1)?.toLowerCase() || 'reset');

    if (filterName === 'reset' || filterName === 'resetfilter') {
      queue.filter = 'none';
      return ctx.sendSuccess('Filters Cleared', '🔄 All audio filters have been reset.');
    }

    queue.filter = filterName;
    return ctx.sendSuccess('Filter Applied', `🎧 Applied **${filterName.toUpperCase()}** audio filter to the current playback!`);
  }
}

module.exports = FilterCommand;
