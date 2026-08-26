const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const Command = require('../Command.js');
const RotiEmbed = require('../../utils/embed.js');
const botConfig = require('../../config.js');

class DelwarnCommand extends Command {
  constructor() {
    super({
      name: 'delwarn',
      description: 'Delete a specific warning from a user record',
      category: 'Moderation',
      usage: 'delwarn <warning_id>',
      userPermissions: [PermissionFlagsBits.ManageMessages],
      slashData: new SlashCommandBuilder()
        .setName('delwarn')
        .setDescription('Delete a specific warning')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
        .addIntegerOption(opt => opt.setName('id').setDescription('Warning ID to delete').setRequired(true))
    });
  }

  async execute(ctx, args) {
    const warnId = ctx.isSlash ? ctx.raw.options.getInteger('id') : parseInt(args[0]);
    if (!warnId) return ctx.sendError('Missing Warning ID', 'Please specify a warning ID to delete.');

    const warn = ctx.client.db.prepare('SELECT * FROM warnings WHERE guild_id = ? AND id = ?').get(ctx.guild.id, warnId);
    if (!warn) return ctx.sendError('Not Found', `Warning #${warnId} was not found on this server.`);

    ctx.client.db.prepare('DELETE FROM warnings WHERE guild_id = ? AND id = ?').run(ctx.guild.id, warnId);
    return ctx.sendSuccess('Warning Deleted', `Warning #${warnId} for <@${warn.user_id}> has been deleted.`);
  }
}

module.exports = DelwarnCommand;
