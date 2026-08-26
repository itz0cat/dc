const { SlashCommandBuilder } = require('discord.js');
const Command = require('../Command.js');
const RotiEmbed = require('../../utils/embed.js');
const botConfig = require('../../config.js');
const { parseDuration, formatDuration } = require('../../utils/time.js');

class RemindmeCommand extends Command {
  constructor() {
    super({
      name: 'remindme',
      description: 'Set a timed reminder for anything',
      category: 'Utility',
      aliases: ['remind', 'reminder'],
      usage: 'remindme <time> <reason>',
      slashData: new SlashCommandBuilder()
        .setName('remindme')
        .setDescription('Set a reminder')
        .addStringOption(opt => opt.setName('time').setDescription('Time (e.g. 10m, 1h, 1d)').setRequired(true))
        .addStringOption(opt => opt.setName('reason').setDescription('What to remind you about').setRequired(true))
    });
  }

  async execute(ctx, args) {
    const timeStr = ctx.isSlash ? ctx.raw.options.getString('time') : args[0];
    const reason = ctx.isSlash ? ctx.raw.options.getString('reason') : args.slice(1).join(' ');

    if (!timeStr || !reason) {
      return ctx.sendError('Missing Parameters', 'Usage: `remindme <time> <reason>`');
    }

    const durationMs = parseDuration(timeStr);
    if (!durationMs) {
      return ctx.sendError('Invalid Time', 'Please use a valid time format like `5m`, `1h`, `1d`.');
    }

    const remindAt = Date.now() + durationMs;

    ctx.client.db.prepare(`
      INSERT INTO reminders (user_id, channel_id, reason, remind_at)
      VALUES (?, ?, ?, ?)
    `).run(ctx.user.id, ctx.channel.id, reason, remindAt);

    const embed = new RotiEmbed()
      .setTitle('⏰ Reminder Set!')
      .setDescription(`I will remind you in **${formatDuration(durationMs)}** (<t:${Math.floor(remindAt / 1000)}:R>):\n*"${reason}"*`)
      .setColor(botConfig.colors.teal);

    return ctx.reply({ embeds: [embed] });
  }
}

module.exports = RemindmeCommand;
