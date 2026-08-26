const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const Command = require('../Command.js');
const RotiEmbed = require('../../utils/embed.js');
const botConfig = require('../../config.js');

class RemovetimeoutCommand extends Command {
  constructor() {
    super({
      name: 'removetimeout',
      description: 'Remove timeout / unmute a member',
      category: 'Moderation',
      aliases: ['untimeout', 'unmute'],
      usage: 'removetimeout <user> [reason]',
      userPermissions: [PermissionFlagsBits.ModerateMembers],
      botPermissions: [PermissionFlagsBits.ModerateMembers],
      slashData: new SlashCommandBuilder()
        .setName('removetimeout')
        .setDescription('Remove timeout / unmute a user')
        .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
        .addUserOption(opt => opt.setName('user').setDescription('User to untimeout').setRequired(true))
        .addStringOption(opt => opt.setName('reason').setDescription('Reason for removing timeout'))
    });
  }

  async execute(ctx, args) {
    const targetUser = ctx.isSlash ? ctx.raw.options.getUser('user') : ctx.raw.mentions.users.first();
    if (!targetUser) return ctx.sendError('Invalid Target', 'Please specify a member.');

    const targetMember = ctx.guild.members.cache.get(targetUser.id);
    if (!targetMember) return ctx.sendError('Not in Server', 'This member is not in the server.');

    const reason = ctx.isSlash ? (ctx.raw.options.getString('reason') || 'No reason provided') : (args.slice(1).join(' ') || 'No reason provided');

    await targetMember.timeout(null, `${reason} | Timeout removed by ${ctx.user.tag}`);
    const caseId = ctx.client.db.addModLog(ctx.guild.id, 'untimeout', targetUser.id, targetUser.tag, ctx.user.id, ctx.user.tag, reason);

    const embed = new RotiEmbed()
      .setTitle(`🔊 Timeout Removed [Case #${caseId}]`)
      .setDescription(`**Member:** <@${targetUser.id}> (${targetUser.tag})\n**Moderator:** <@${ctx.user.id}>\n**Reason:** ${reason}`)
      .setColor(botConfig.colors.success);

    return ctx.reply({ embeds: [embed] });
  }
}

module.exports = RemovetimeoutCommand;
