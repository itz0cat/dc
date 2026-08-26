const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const Command = require('../Command.js');
const RotiEmbed = require('../../utils/embed.js');
const botConfig = require('../../config.js');

class ReasonCommand extends Command {
  constructor() {
    super({
      name: 'reason',
      description: 'Change or update the reason for an existing moderation case',
      category: 'Moderation',
      usage: 'reason <case_id> <new_reason>',
      userPermissions: [PermissionFlagsBits.ManageMessages],
      slashData: new SlashCommandBuilder()
        .setName('reason')
        .setDescription('Update reason of a moderation action')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
        .addIntegerOption(opt => opt.setName('case_id').setDescription('Case ID').setRequired(true))
        .addStringOption(opt => opt.setName('reason').setDescription('New reason').setRequired(true))
    });
  }

  async execute(ctx, args) {
    const caseId = ctx.isSlash ? ctx.raw.options.getInteger('case_id') : parseInt(args[0]);
    const newReason = ctx.isSlash ? ctx.raw.options.getString('reason') : args.slice(1).join(' ');

    if (!caseId || !newReason) return ctx.sendError('Missing Parameters', 'Usage: `reason <case_id> <new_reason>`');

    const log = ctx.client.db.prepare('SELECT * FROM modlogs WHERE guild_id = ? AND case_id = ?').get(ctx.guild.id, caseId);
    if (!log) return ctx.sendError('Not Found', `Case #${caseId} does not exist.`);

    ctx.client.db.prepare('UPDATE modlogs SET reason = ? WHERE guild_id = ? AND case_id = ?').run(newReason, ctx.guild.id, caseId);

    const embed = new RotiEmbed()
      .setTitle(`✏️ Case #${caseId} Updated`)
      .setDescription(`Reason for Case #${caseId} has been updated:\n**New Reason:** ${newReason}\n**Updated by:** <@${ctx.user.id}>`)
      .setColor(botConfig.colors.success);

    return ctx.reply({ embeds: [embed] });
  }
}

module.exports = ReasonCommand;
