const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const Command = require('../Command.js');
const RotiEmbed = require('../../utils/embed.js');
const botConfig = require('../../config.js');

class ClearwarnsCommand extends Command {
  constructor() {
    super({
      name: 'clearwarns',
      description: 'Delete all warnings for a user',
      category: 'Moderation',
      usage: 'clearwarns <user>',
      userPermissions: [PermissionFlagsBits.ManageGuild],
      slashData: new SlashCommandBuilder()
        .setName('clearwarns')
        .setDescription('Delete all warnings of a user')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
        .addUserOption(opt => opt.setName('user').setDescription('User to clear warnings for').setRequired(true))
    });
  }

  async execute(ctx, args) {
    const targetUser = ctx.isSlash ? ctx.raw.options.getUser('user') : ctx.raw.mentions.users.first();
    if (!targetUser) return ctx.sendError('Missing User', 'Please specify a user to clear warnings for.');

    ctx.client.db.prepare('DELETE FROM warnings WHERE guild_id = ? AND user_id = ?').run(ctx.guild.id, targetUser.id);
    return ctx.sendSuccess('Warnings Cleared', `All warnings for <@${targetUser.id}> (${targetUser.tag}) have been wiped.`);
  }
}

module.exports = ClearwarnsCommand;
