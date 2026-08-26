const { SlashCommandBuilder, PermissionFlagsBits, ChannelType } = require('discord.js');
const Command = require('../Command.js');
const RotiEmbed = require('../../utils/embed.js');
const botConfig = require('../../config.js');

class VoicemoveCommand extends Command {
  constructor() {
    super({
      name: 'voicemove',
      description: 'Move all connected members from one voice channel to another',
      category: 'Moderation',
      usage: 'voicemove <from_channel> <to_channel>',
      userPermissions: [PermissionFlagsBits.MoveMembers],
      botPermissions: [PermissionFlagsBits.MoveMembers],
      slashData: new SlashCommandBuilder()
        .setName('voicemove')
        .setDescription('Move members between voice channels')
        .setDefaultMemberPermissions(PermissionFlagsBits.MoveMembers)
        .addChannelOption(opt => opt.setName('from').setDescription('Source voice channel').addChannelTypes(ChannelType.GuildVoice).setRequired(true))
        .addChannelOption(opt => opt.setName('to').setDescription('Destination voice channel').addChannelTypes(ChannelType.GuildVoice).setRequired(true))
    });
  }

  async execute(ctx, args) {
    const fromChannel = ctx.isSlash ? ctx.raw.options.getChannel('from') : ctx.guild.channels.cache.get(args[0]?.replace(/<#|>/g, ''));
    const toChannel = ctx.isSlash ? ctx.raw.options.getChannel('to') : ctx.guild.channels.cache.get(args[1]?.replace(/<#|>/g, ''));

    if (!fromChannel || !toChannel) {
      return ctx.sendError('Invalid Channels', 'Please specify valid source and destination voice channels.');
    }

    const members = fromChannel.members;
    if (members.size === 0) {
      return ctx.sendError('Empty Channel', `<#${fromChannel.id}> has no connected members.`);
    }

    let moved = 0;
    for (const [, member] of members) {
      await member.voice.setChannel(toChannel.id, `Moved by ${ctx.user.tag}`).catch(() => {});
      moved++;
    }

    return ctx.sendSuccess('Members Moved', `Moved **${moved}** member(s) from <#${fromChannel.id}> to <#${toChannel.id}>!`);
  }
}

module.exports = VoicemoveCommand;
