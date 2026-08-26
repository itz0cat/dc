const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const Command = require('../Command.js');
const RotiEmbed = require('../../utils/embed.js');
const botConfig = require('../../config.js');
const { parseDuration, formatDuration } = require('../../utils/time.js');

class TimeoutCommand extends Command {
  constructor() {
    super({
      name: 'timeout',
      description: 'Timeout / mute a member for a specified duration',
      category: 'Moderation',
      aliases: ['mute'],
      usage: 'timeout <user> <duration> [reason]',
      userPermissions: [PermissionFlagsBits.ModerateMembers],
      botPermissions: [PermissionFlagsBits.ModerateMembers],
      slashData: new SlashCommandBuilder()
        .setName('timeout')
        .setDescription('Timeout / mute a user')
        .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
        .addUserOption(opt => opt.setName('user').setDescription('User to timeout').setRequired(true))
        .addStringOption(opt => opt.setName('duration').setDescription('Duration (e.g. 5m, 1h, 1d)').setRequired(true))
        .addStringOption(opt => opt.setName('reason').setDescription('Reason for timeout'))
    });
  }

  async execute(ctx, args) {
    const targetUser = ctx.isSlash ? ctx.raw.options.getUser('user') : ctx.raw.mentions.users.first();
    if (!targetUser) return ctx.sendError('Invalid Target', 'Please specify a member.');

    const targetMember = ctx.guild.members.cache.get(targetUser.id);
    if (!targetMember) return ctx.sendError('Not in Server', 'This member is not in the server.');

    if (!targetMember.moderatable) {
      return ctx.sendError('Cannot Timeout', 'I cannot timeout this member due to role hierarchy.');
    }

    const durationStr = ctx.isSlash ? ctx.raw.options.getString('duration') : args[1];
    const durationMs = parseDuration(durationStr);
    if (!durationMs || durationMs > 28 * 86400 * 1000) {
      return ctx.sendError('Invalid Duration', 'Duration must be between 1 second and 28 days (e.g. `10m`, `2h`, `1d`).');
    }

    const reason = ctx.isSlash ? (ctx.raw.options.getString('reason') || 'No reason provided') : (args.slice(2).join(' ') || 'No reason provided');

    await targetMember.timeout(durationMs, `${reason} | Timed out by ${ctx.user.tag}`);
    const caseId = ctx.client.db.addModLog(ctx.guild.id, 'timeout', targetUser.id, targetUser.tag, ctx.user.id, ctx.user.tag, reason, durationMs);

    const embed = new RotiEmbed()
      .setTitle(`🔇 Member Timed Out [Case #${caseId}]`)
      .setDescription(`**Member:** <@${targetUser.id}> (${targetUser.tag})\n**Duration:** ${formatDuration(durationMs)}\n**Moderator:** <@${ctx.user.id}>\n**Reason:** ${reason}`)
      .setColor(botConfig.colors.warning);

    return ctx.reply({ embeds: [embed] });
  }
}

module.exports = TimeoutCommand;
