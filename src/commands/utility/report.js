const { SlashCommandBuilder } = require('discord.js');
const Command = require('../Command.js');
const RotiEmbed = require('../../utils/embed.js');
const botConfig = require('../../config.js');

class ReportCommand extends Command {
  constructor() {
    super({
      name: 'report',
      description: 'Report a bug, glitch, or issue directly to the development team',
      category: 'Utility',
      aliases: ['bugreport', 'bug'],
      usage: 'report <issue description>',
      slashData: new SlashCommandBuilder()
        .setName('report')
        .setDescription('Report a bug or glitch')
        .addStringOption(opt => opt.setName('issue').setDescription('Describe the bug or problem').setRequired(true))
    });
  }

  async execute(ctx, args) {
    const issue = ctx.isSlash ? ctx.raw.options.getString('issue') : args.join(' ');
    if (!issue) return ctx.sendError('Missing Description', 'Please provide details about the issue you encountered.');

    ctx.client.logger.warn(`[BUG REPORT from ${ctx.user.tag} (${ctx.user.id}) in ${ctx.guild?.name || 'DM'}]: ${issue}`);

    const embed = new RotiEmbed()
      .setTitle('📝 Bug Report Received')
      .setDescription(`Thank you for submitting a report!\nOur development team will investigate this issue.\n\n**Reported:**\n*"${issue}"*`)
      .setColor(botConfig.colors.success);

    return ctx.replyEphemeral({ embeds: [embed] });
  }
}

module.exports = ReportCommand;
