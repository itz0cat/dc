const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const Command = require('../Command.js');
const RotiEmbed = require('../../utils/embed.js');
const botConfig = require('../../config.js');
const { parseDuration, formatDuration } = require('../../utils/time.js');

class TempbanCommand extends Command {
  constructor() {
    super({
      name: 'tempban',
      description: 'Temporarily ban a user from the server for a specified duration',
      category: 'Moderation',
      usage: 'tempban <user> <duration> [reason]',
      userPermissions: [PermissionFlagsBits.BanMembers],
      botPermissions: [PermissionFlagsBits.BanMembers],
      slashData: new SlashCommandBuilder()
        .setName('tempban')
        .setDescription('Temporarily ban a user')
        .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers)
        .addUserOption(opt => opt.setName('user').setDescription('User to tempban').setRequired(true))
        .addStringOption(opt => opt.setName('duration').setDescription('Duration (e.g. 1h, 1d, 7d)').setRequired(true))
        .addStringOption(opt => opt.setName('reason').setDescription('Reason for tempban'))
    });
  }

  async execute(ctx, args) {
    const targetUser = ctx.isSlash ? ctx.raw.options.getUser('user') : ctx.raw.mentions.users.first();
    if (!targetUser) return ctx.sendError('Invalid Target', 'Please specify a user.');

    const durationStr = ctx.isSlash ? ctx.raw.options.getString('duration') : args[1];
    const durationMs = parseDuration(durationStr);
    if (!durationMs) return ctx.sendError('Invalid Duration', 'Please provide a valid duration like `1h`, `12h`, `7d`.');

    const reason = ctx.isSlash ? (ctx.raw.options.getString('reason') || 'No reason provided') : (args.slice(2).join(' ') || 'No reason provided');

    const targetMember = ctx.guild.members.cache.get(targetUser.id);
    if (targetMember && !targetMember.bannable) {
      return ctx.sendError('Cannot Ban', 'I cannot ban this user due to role hierarchy.');
    }

    await targetUser.send({
      embeds: [RotiEmbed.error(`Temporarily Banned from ${ctx.guild.name}`, `**Duration:** ${formatDuration(durationMs)}\n**Reason:** ${reason}`)]
    }).catch(() => {});

    await ctx.guild.members.ban(targetUser.id, { reason: `Tempban (${formatDuration(durationMs)}): ${reason}` });

    const caseId = ctx.client.db.addModLog(ctx.guild.id, 'tempban', targetUser.id, targetUser.tag, ctx.user.id, ctx.user.tag, reason, durationMs);

    setTimeout(async () => {
      try {
        await ctx.guild.members.unban(targetUser.id, 'Tempban expired');
      } catch (e) {}
    }, durationMs);

    const embed = new RotiEmbed()
      .setTitle(`⏳ User Temporarily Banned [Case #${caseId}]`)
      .setDescription(`**User:** <@${targetUser.id}> (${targetUser.tag})\n**Duration:** ${formatDuration(durationMs)}\n**Moderator:** <@${ctx.user.id}>\n**Reason:** ${reason}`)
      .setColor(botConfig.colors.error);

    return ctx.reply({ embeds: [embed] });
  }
}

module.exports = TempbanCommand;
