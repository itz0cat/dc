const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const Command = require('../Command.js');
const RotiEmbed = require('../../utils/embed.js');
const botConfig = require('../../config.js');
const { parseDuration, formatDuration } = require('../../utils/time.js');

class SlowmodeCommand extends Command {
  constructor() {
    super({
      name: 'slowmode',
      description: 'Set slowmode rate limit for the channel',
      category: 'Moderation',
      usage: 'slowmode <seconds/duration> [reason]',
      userPermissions: [PermissionFlagsBits.ManageChannels],
      botPermissions: [PermissionFlagsBits.ManageChannels],
      slashData: new SlashCommandBuilder()
        .setName('slowmode')
        .setDescription('Set slowmode for a channel')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels)
        .addStringOption(opt => opt.setName('time').setDescription('Time (e.g. 5s, 10s, 1m, 0 to disable)').setRequired(true))
        .addStringOption(opt => opt.setName('reason').setDescription('Reason'))
    });
  }

  async execute(ctx, args) {
    const timeStr = ctx.isSlash ? ctx.raw.options.getString('time') : args[0];
    if (!timeStr) return ctx.sendError('Missing Duration', 'Please specify a duration like `5s`, `10s`, `1m` or `0` to disable.');

    let seconds = 0;
    if (timeStr === '0' || timeStr.toLowerCase() === 'off' || timeStr.toLowerCase() === 'disable') {
      seconds = 0;
    } else if (/^\d+$/.test(timeStr)) {
      seconds = parseInt(timeStr);
    } else {
      const ms = parseDuration(timeStr);
      if (!ms) return ctx.sendError('Invalid Duration', 'Invalid time format. Example: `5s`, `10s`, `1m`, `1h`.');
      seconds = Math.floor(ms / 1000);
    }

    if (seconds > 21600) return ctx.sendError('Too High', 'Slowmode cannot exceed 6 hours (21600 seconds).');

    await ctx.channel.setRateLimitPerUser(seconds, `Slowmode set by ${ctx.user.tag}`);

    if (seconds === 0) {
      return ctx.sendSuccess('Slowmode Disabled', 'Slowmode has been turned off for this channel.');
    } else {
      return ctx.sendSuccess('Slowmode Enabled', `Slowmode set to **${seconds} seconds** (${formatDuration(seconds * 1000)} per message).`);
    }
  }
}

module.exports = SlowmodeCommand;
