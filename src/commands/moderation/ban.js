const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const Command = require('../Command.js');
const RotiEmbed = require('../../utils/embed.js');
const botConfig = require('../../config.js');

class BanCommand extends Command {
  constructor() {
    super({
      name: 'ban',
      description: 'Ban a user from the server with optional reason and message deletion',
      category: 'Moderation',
      usage: 'ban <user> [reason] [delete_days]',
      userPermissions: [PermissionFlagsBits.BanMembers],
      botPermissions: [PermissionFlagsBits.BanMembers],
      slashData: new SlashCommandBuilder()
        .setName('ban')
        .setDescription('Ban a user from the server')
        .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers)
        .addUserOption(opt => opt.setName('user').setDescription('User to ban').setRequired(true))
        .addStringOption(opt => opt.setName('reason').setDescription('Reason for the ban'))
        .addIntegerOption(opt => opt.setName('delete_days').setDescription('Days of messages to delete (0-7)').setMinValue(0).setMaxValue(7))
    });
  }

  async execute(ctx, args) {
    const targetUser = ctx.isSlash ? ctx.raw.options.getUser('user') : ctx.raw.mentions.users.first();
    if (!targetUser) return ctx.sendError('Invalid Target', 'Please specify a user to ban.');

    const reason = ctx.isSlash ? (ctx.raw.options.getString('reason') || 'No reason provided') : (args.slice(1).join(' ') || 'No reason provided');
    const deleteDays = ctx.isSlash ? (ctx.raw.options.getInteger('delete_days') || 0) : 0;

    const targetMember = ctx.guild.members.cache.get(targetUser.id);
    if (targetMember && !targetMember.bannable) {
      return ctx.sendError('Cannot Ban', 'I cannot ban this user due to role hierarchy.');
    }

    // Attempt DM
    await targetUser.send({
      embeds: [RotiEmbed.error(`Banned from ${ctx.guild.name}`, `**Reason:** ${reason}\n**Moderator:** ${ctx.user.tag}`)]
    }).catch(() => {});

    await ctx.guild.members.ban(targetUser.id, {
      reason: `${reason} | Banned by ${ctx.user.tag}`,
      deleteMessageSeconds: deleteDays * 86400
    });

    const caseId = ctx.client.db.addModLog(ctx.guild.id, 'ban', targetUser.id, targetUser.tag, ctx.user.id, ctx.user.tag, reason);

    const embed = new RotiEmbed()
      .setTitle(`🔨 User Banned [Case #${caseId}]`)
      .setDescription(`**User:** <@${targetUser.id}> (${targetUser.tag})\n**Moderator:** <@${ctx.user.id}>\n**Reason:** ${reason}`)
      .setColor(botConfig.colors.error);

    return ctx.reply({ embeds: [embed] });
  }
}

module.exports = BanCommand;
