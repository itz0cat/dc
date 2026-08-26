const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const Command = require('../Command.js');
const RotiEmbed = require('../../utils/embed.js');
const botConfig = require('../../config.js');

class KickCommand extends Command {
  constructor() {
    super({
      name: 'kick',
      description: 'Kick a member from the server',
      category: 'Moderation',
      usage: 'kick <user> [reason]',
      userPermissions: [PermissionFlagsBits.KickMembers],
      botPermissions: [PermissionFlagsBits.KickMembers],
      slashData: new SlashCommandBuilder()
        .setName('kick')
        .setDescription('Kick a member from the server')
        .setDefaultMemberPermissions(PermissionFlagsBits.KickMembers)
        .addUserOption(opt => opt.setName('user').setDescription('User to kick').setRequired(true))
        .addStringOption(opt => opt.setName('reason').setDescription('Reason for kick'))
    });
  }

  async execute(ctx, args) {
    const targetUser = ctx.isSlash ? ctx.raw.options.getUser('user') : ctx.raw.mentions.users.first();
    if (!targetUser) return ctx.sendError('Invalid Target', 'Please specify a member to kick.');

    const targetMember = ctx.guild.members.cache.get(targetUser.id);
    if (!targetMember) return ctx.sendError('Not in Server', 'This user is not currently in the server.');

    if (!targetMember.kickable) {
      return ctx.sendError('Cannot Kick', 'I cannot kick this member due to role hierarchy.');
    }

    const reason = ctx.isSlash ? (ctx.raw.options.getString('reason') || 'No reason provided') : (args.slice(1).join(' ') || 'No reason provided');

    await targetUser.send({
      embeds: [RotiEmbed.warning(`Kicked from ${ctx.guild.name}`, `**Reason:** ${reason}\n**Moderator:** ${ctx.user.tag}`)]
    }).catch(() => {});

    await targetMember.kick(`${reason} | Kicked by ${ctx.user.tag}`);

    const caseId = ctx.client.db.addModLog(ctx.guild.id, 'kick', targetUser.id, targetUser.tag, ctx.user.id, ctx.user.tag, reason);

    const embed = new RotiEmbed()
      .setTitle(`👢 Member Kicked [Case #${caseId}]`)
      .setDescription(`**Member:** <@${targetUser.id}> (${targetUser.tag})\n**Moderator:** <@${ctx.user.id}>\n**Reason:** ${reason}`)
      .setColor(botConfig.colors.warning);

    return ctx.reply({ embeds: [embed] });
  }
}

module.exports = KickCommand;
