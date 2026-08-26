const { SlashCommandBuilder, PermissionFlagsBits, ChannelType } = require('discord.js');
const Command = require('../Command.js');
const RotiEmbed = require('../../utils/embed.js');
const botConfig = require('../../config.js');

class UnlockCommand extends Command {
  constructor() {
    super({
      name: 'unlock',
      description: 'Unlock a locked channel to allow members to send messages',
      category: 'Moderation',
      usage: 'unlock [channel] [reason]',
      userPermissions: [PermissionFlagsBits.ManageChannels],
      botPermissions: [PermissionFlagsBits.ManageChannels],
      slashData: new SlashCommandBuilder()
        .setName('unlock')
        .setDescription('Unlock a channel')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels)
        .addChannelOption(opt => opt.setName('channel').setDescription('Channel to unlock').addChannelTypes(ChannelType.GuildText))
        .addStringOption(opt => opt.setName('reason').setDescription('Reason for unlocking'))
    });
  }

  async execute(ctx, args) {
    const channel = ctx.isSlash ? (ctx.raw.options.getChannel('channel') || ctx.channel) : (ctx.guild.channels.cache.get(args[0]?.replace(/<#|>/g, '')) || ctx.channel);
    const reason = ctx.isSlash ? (ctx.raw.options.getString('reason') || 'No reason provided') : (args.slice(1).join(' ') || 'No reason provided');

    await channel.permissionOverwrites.edit(ctx.guild.roles.everyone, {
      SendMessages: null,
      AddReactions: null
    }, { reason: `Unlocked by ${ctx.user.tag}: ${reason}` });

    const embed = new RotiEmbed()
      .setTitle('🔓 Channel Unlocked')
      .setDescription(`This channel has been unlocked by <@${ctx.user.id}>.\n**Reason:** ${reason}`)
      .setColor(botConfig.colors.success);

    await channel.send({ embeds: [embed] });
    if (ctx.isSlash) return ctx.replyEphemeral({ content: `✅ <#${channel.id}> unlocked.` });
  }
}

module.exports = UnlockCommand;
