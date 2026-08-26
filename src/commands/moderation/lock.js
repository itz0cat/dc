const { SlashCommandBuilder, PermissionFlagsBits, ChannelType } = require('discord.js');
const Command = require('../Command.js');
const RotiEmbed = require('../../utils/embed.js');
const botConfig = require('../../config.js');

class LockCommand extends Command {
  constructor() {
    super({
      name: 'lock',
      description: 'Lock a channel to prevent regular members from sending messages',
      category: 'Moderation',
      usage: 'lock [channel] [reason]',
      userPermissions: [PermissionFlagsBits.ManageChannels],
      botPermissions: [PermissionFlagsBits.ManageChannels],
      slashData: new SlashCommandBuilder()
        .setName('lock')
        .setDescription('Lock a channel')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels)
        .addChannelOption(opt => opt.setName('channel').setDescription('Channel to lock').addChannelTypes(ChannelType.GuildText))
        .addStringOption(opt => opt.setName('reason').setDescription('Reason for locking'))
    });
  }

  async execute(ctx, args) {
    const channel = ctx.isSlash ? (ctx.raw.options.getChannel('channel') || ctx.channel) : (ctx.guild.channels.cache.get(args[0]?.replace(/<#|>/g, '')) || ctx.channel);
    const reason = ctx.isSlash ? (ctx.raw.options.getString('reason') || 'No reason provided') : (args.slice(1).join(' ') || 'No reason provided');

    await channel.permissionOverwrites.edit(ctx.guild.roles.everyone, {
      SendMessages: false,
      AddReactions: false
    }, { reason: `Locked by ${ctx.user.tag}: ${reason}` });

    const embed = new RotiEmbed()
      .setTitle('🔒 Channel Locked')
      .setDescription(`This channel has been locked by <@${ctx.user.id}>.\n**Reason:** ${reason}`)
      .setColor(botConfig.colors.error);

    await channel.send({ embeds: [embed] });
    if (ctx.isSlash) return ctx.replyEphemeral({ content: `✅ <#${channel.id}> locked.` });
  }
}

module.exports = LockCommand;
