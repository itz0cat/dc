const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const Command = require('../Command.js');
const RotiEmbed = require('../../utils/embed.js');
const botConfig = require('../../config.js');

class SoftbanCommand extends Command {
  constructor() {
    super({
      name: 'softban',
      description: 'Softban a user (bans and immediately unbans to purge their messages)',
      category: 'Moderation',
      usage: 'softban <user> [reason]',
      userPermissions: [PermissionFlagsBits.BanMembers],
      botPermissions: [PermissionFlagsBits.BanMembers],
      slashData: new SlashCommandBuilder()
        .setName('softban')
        .setDescription('Softban a user (kicks and cleans messages)')
        .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers)
        .addUserOption(opt => opt.setName('user').setDescription('User to softban').setRequired(true))
        .addStringOption(opt => opt.setName('reason').setDescription('Reason for softban'))
    });
  }

  async execute(ctx, args) {
    const targetUser = ctx.isSlash ? ctx.raw.options.getUser('user') : ctx.raw.mentions.users.first();
    if (!targetUser) return ctx.sendError('Invalid Target', 'Please specify a user to softban.');

    const reason = ctx.isSlash ? (ctx.raw.options.getString('reason') || 'Softban') : (args.slice(1).join(' ') || 'Softban');

    const targetMember = ctx.guild.members.cache.get(targetUser.id);
    if (targetMember && !targetMember.bannable) {
      return ctx.sendError('Cannot Softban', 'I cannot softban this user due to role hierarchy.');
    }

    await ctx.guild.members.ban(targetUser.id, { reason: `Softban: ${reason}`, deleteMessageSeconds: 7 * 86400 });
    await ctx.guild.members.unban(targetUser.id, 'Softban complete');

    const caseId = ctx.client.db.addModLog(ctx.guild.id, 'softban', targetUser.id, targetUser.tag, ctx.user.id, ctx.user.tag, reason);

    const embed = new RotiEmbed()
      .setTitle(`🧹 User Softbanned [Case #${caseId}]`)
      .setDescription(`**User:** <@${targetUser.id}> (${targetUser.tag})\n**Moderator:** <@${ctx.user.id}>\n**Reason:** ${reason}\n*(Messages purged and user removed)*`)
      .setColor(botConfig.colors.warning);

    return ctx.reply({ embeds: [embed] });
  }
}

module.exports = SoftbanCommand;
