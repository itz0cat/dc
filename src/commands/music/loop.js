const { SlashCommandBuilder } = require('discord.js');
const Command = require('../Command.js');
const RotiEmbed = require('../../utils/embed.js');
const botConfig = require('../../config.js');

class LoopCommand extends Command {
  constructor() {
    super({
      name: 'loop',
      description: 'Set loop repeat mode for current track, whole queue, or turn it off',
      category: 'Music',
      aliases: ['repeat'],
      usage: 'loop <off/track/queue>',
      slashData: new SlashCommandBuilder()
        .setName('loop')
        .setDescription('Set loop mode')
        .addStringOption(opt => opt.setName('mode').setDescription('Loop mode').addChoices(
          { name: 'Off', value: 'off' },
          { name: 'Repeat Track', value: 'track' },
          { name: 'Repeat Queue', value: 'queue' }
        ).setRequired(true))
    });
  }

  async execute(ctx, args) {
    const queue = ctx.client.music.getQueue(ctx.guild.id);
    if (!queue) return ctx.sendError('Not Playing', 'No music is currently playing.');

    const mode = ctx.isSlash ? ctx.raw.options.getString('mode') : args[0]?.toLowerCase();

    if (!mode || !['off', 'track', 'queue', 'song'].includes(mode)) {
      return ctx.sendError('Invalid Mode', 'Valid modes: `off`, `track`, `queue`.');
    }

    queue.loop = (mode === 'song') ? 'track' : mode;
    return ctx.sendSuccess('Loop Mode Updated', `🔂 Loop mode is now set to **${queue.loop.toUpperCase()}**.`);
  }
}

module.exports = LoopCommand;
