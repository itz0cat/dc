const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const Command = require('../Command.js');
const RotiEmbed = require('../../utils/embed.js');
const botConfig = require('../../config.js');
const { formatDuration } = require('../../utils/time.js');

class CaseCommand extends Command {
  constructor() {
    super({
      name: 'case',
      description: 'Get information about a specific moderation case',
      category: 'Moderation',
      usage: 'case <case_id>',
      userPermissions: [PermissionFlagsBits.ManageMessages],
      slashData: new SlashCommandBuilder()
        .setName('case')
        .setDescription('Get moderation case information')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
        .addIntegerOption(opt => opt.setName('id').setDescription('Case ID').setRequired(true))
    });
  }

  async execute(ctx, args) {
    const caseId = ctx.isSlash ? ctx.raw.options.getInteger('id') : parseInt(args[0]);
    if (!caseId) return ctx.sendError('Missing Case ID', 'Please specify a valid case ID.');

    const log = ctx.client.db.prepare('SELECT * FROM modlogs WHERE guild_id = ? AND case_id = ?').get(ctx.guild.id, caseId);
    if (!log) return ctx.sendError('Not Found', `Case #${caseId} does not exist on this server.`);

    const embed = new RotiEmbed()
      .setTitle(`📜 Moderation Case #${log.case_id} [${log.action.toUpperCase()}]`)
      .addFields(
        { name: 'Target User', value: `<@${log.user_id}> (${log.user_tag || log.user_id})`, inline: true },
        { name: 'Moderator', value: `<@${log.mod_id}> (${log.mod_tag || log.mod_id})`, inline: true },
        { name: 'Action', value: log.action.toUpperCase(), inline: true },
        { name: 'Reason', value: log.reason || '*No reason recorded*', inline: false },
        { name: 'Date', value: `<t:${Math.floor(log.created_at / 1000)}:F> (<t:${Math.floor(log.created_at / 1000)}:R>)`, inline: false }
      )
      .setColor(botConfig.colors.teal);

    if (log.duration) {
      embed.addFields({ name: 'Duration', value: formatDuration(log.duration), inline: true });
    }

    return ctx.reply({ embeds: [embed] });
  }
}

module.exports = CaseCommand;
