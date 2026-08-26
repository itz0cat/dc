const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const Command = require('../Command.js');
const RotiEmbed = require('../../utils/embed.js');
const botConfig = require('../../config.js');

class DecancerCommand extends Command {
  constructor() {
    super({
      name: 'decancer',
      description: 'Removes zalgo / non-standard unicode characters from a user\'s name',
      category: 'Moderation',
      usage: 'decancer <user>',
      userPermissions: [PermissionFlagsBits.ManageNicknames],
      botPermissions: [PermissionFlagsBits.ManageNicknames],
      slashData: new SlashCommandBuilder()
        .setName('decancer')
        .setDescription('Clean unreadable/zalgo characters from a member\'s name')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageNicknames)
        .addUserOption(opt => opt.setName('user').setDescription('Target member').setRequired(true))
    });
  }

  async execute(ctx, args) {
    const targetUser = ctx.isSlash ? ctx.raw.options.getUser('user') : ctx.raw.mentions.users.first();
    if (!targetUser) return ctx.sendError('Missing Target', 'Please specify a member.');

    const targetMember = ctx.guild.members.cache.get(targetUser.id);
    if (!targetMember) return ctx.sendError('Not in Server', 'Member is not in the server.');

    const rawName = targetMember.displayName;
    const cleanName = rawName.replace(/[^\x20-\x7E]/g, '').trim() || 'CleanedName';

    await targetMember.setNickname(cleanName, `Decancer by ${ctx.user.tag}`);
    return ctx.sendSuccess('Name Cleaned', `Sanitized <@${targetUser.id}>'s nickname from \`${rawName}\` to **\`${cleanName}\`**.`);
  }
}

module.exports = DecancerCommand;
