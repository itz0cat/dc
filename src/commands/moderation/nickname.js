const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const Command = require('../Command.js');
const RotiEmbed = require('../../utils/embed.js');
const botConfig = require('../../config.js');

class NicknameCommand extends Command {
  constructor() {
    super({
      name: 'nickname',
      description: 'Change the nickname of a user or reset it',
      category: 'Moderation',
      aliases: ['setnick', 'nick'],
      usage: 'nickname <user> [nickname]',
      userPermissions: [PermissionFlagsBits.ManageNicknames],
      botPermissions: [PermissionFlagsBits.ManageNicknames],
      slashData: new SlashCommandBuilder()
        .setName('nickname')
        .setDescription('Change the nickname of a user')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageNicknames)
        .addUserOption(opt => opt.setName('user').setDescription('Target member').setRequired(true))
        .addStringOption(opt => opt.setName('nickname').setDescription('New nickname (leave blank to reset)'))
    });
  }

  async execute(ctx, args) {
    const targetUser = ctx.isSlash ? ctx.raw.options.getUser('user') : ctx.raw.mentions.users.first();
    if (!targetUser) return ctx.sendError('Missing Target', 'Please specify a member.');

    const targetMember = ctx.guild.members.cache.get(targetUser.id);
    if (!targetMember) return ctx.sendError('Not in Server', 'Member is not in the server.');

    const newNick = ctx.isSlash ? (ctx.raw.options.getString('nickname') || null) : (args.slice(1).join(' ') || null);

    await targetMember.setNickname(newNick, `Nickname changed by ${ctx.user.tag}`);

    if (newNick) {
      return ctx.sendSuccess('Nickname Changed', `Changed <@${targetUser.id}>'s nickname to **${newNick}**.`);
    } else {
      return ctx.sendSuccess('Nickname Reset', `Reset <@${targetUser.id}>'s nickname to default.`);
    }
  }
}

module.exports = NicknameCommand;
