const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const Command = require('../Command.js');
const RotiEmbed = require('../../utils/embed.js');
const botConfig = require('../../config.js');

class UnbanCommand extends Command {
  constructor() {
    super({
      name: 'unban',
      description: 'Unban a member from the server by user ID',
      category: 'Moderation',
      usage: 'unban <user_id> [reason]',
      userPermissions: [PermissionFlagsBits.BanMembers],
      botPermissions: [PermissionFlagsBits.BanMembers],
      slashData: new SlashCommandBuilder()
        .setName('unban')
        .setDescription('Unban a user from the server')
        .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers)
        .addStringOption(opt => opt.setName('user_id').setDescription('User ID to unban').setRequired(true))
        .addStringOption(opt => opt.setName('reason').setDescription('Reason for unban'))
    });
  }

  async execute(ctx, args) {
    const userId = ctx.isSlash ? ctx.raw.options.getString('user_id') : args[0];
    if (!userId) return ctx.sendError('Missing User ID', 'Please provide the user ID to unban.');

    const reason = ctx.isSlash ? (ctx.raw.options.getString('reason') || 'No reason provided') : (args.slice(1).join(' ') || 'No reason provided');

    try {
      const banInfo = await ctx.guild.bans.fetch(userId).catch(() => null);
      if (!banInfo) {
        return ctx.sendError('Not Banned', `User ID \`${userId}\` is not banned on this server.`);
      }

      await ctx.guild.members.unban(userId, `${reason} | Unbanned by ${ctx.user.tag}`);
      const caseId = ctx.client.db.addModLog(ctx.guild.id, 'unban', userId, banInfo.user.tag, ctx.user.id, ctx.user.tag, reason);

      const embed = new RotiEmbed()
        .setTitle(`🔓 User Unbanned [Case #${caseId}]`)
        .setDescription(`**User:** <@${userId}> (${banInfo.user.tag})\n**Moderator:** <@${ctx.user.id}>\n**Reason:** ${reason}`)
        .setColor(botConfig.colors.success);

      return ctx.reply({ embeds: [embed] });
    } catch (err) {
      return ctx.sendError('Unban Failed', `Failed to unban user: ${err.message}`);
    }
  }
}

module.exports = UnbanCommand;
