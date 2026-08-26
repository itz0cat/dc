const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const Command = require('../Command.js');
const RotiEmbed = require('../../utils/embed.js');
const botConfig = require('../../config.js');

class WarnCommand extends Command {
  constructor() {
    super({
      name: 'warn',
      description: 'Issue a formal warning to a user',
      category: 'Moderation',
      usage: 'warn <user> [reason]',
      userPermissions: [PermissionFlagsBits.ManageMessages],
      slashData: new SlashCommandBuilder()
        .setName('warn')
        .setDescription('Warn a user')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
        .addUserOption(opt => opt.setName('user').setDescription('User to warn').setRequired(true))
        .addStringOption(opt => opt.setName('reason').setDescription('Reason for the warning'))
    });
  }

  async execute(ctx, args) {
    const targetUser = ctx.isSlash ? ctx.raw.options.getUser('user') : ctx.raw.mentions.users.first();
    if (!targetUser) return ctx.sendError('Invalid Target', 'Please specify a user to warn.');

    const reason = ctx.isSlash ? (ctx.raw.options.getString('reason') || 'No reason provided') : (args.slice(1).join(' ') || 'No reason provided');

    // Add to DB
    ctx.client.db.prepare(`
      INSERT INTO warnings (guild_id, user_id, mod_id, reason, created_at)
      VALUES (?, ?, ?, ?, ?)
    `).run(ctx.guild.id, targetUser.id, ctx.user.id, reason, Date.now());

    const totalWarns = ctx.client.db.prepare('SELECT COUNT(*) FROM warnings WHERE guild_id = ? AND user_id = ?').pluck().get(ctx.guild.id, targetUser.id) || 1;
    const caseId = ctx.client.db.addModLog(ctx.guild.id, 'warn', targetUser.id, targetUser.tag, ctx.user.id, ctx.user.tag, reason);

    await targetUser.send({
      embeds: [RotiEmbed.warning(`Warned in ${ctx.guild.name}`, `**Reason:** ${reason}\n**Warning Count:** ${totalWarns}\n**Moderator:** ${ctx.user.tag}`)]
    }).catch(() => {});

    const embed = new RotiEmbed()
      .setTitle(`⚠️ User Warned [Case #${caseId}]`)
      .setDescription(`**User:** <@${targetUser.id}> (${targetUser.tag})\n**Total Warnings:** ${totalWarns}\n**Moderator:** <@${ctx.user.id}>\n**Reason:** ${reason}`)
      .setColor(botConfig.colors.warning);

    return ctx.reply({ embeds: [embed] });
  }
}

module.exports = WarnCommand;
