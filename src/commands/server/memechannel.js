const { SlashCommandBuilder, PermissionFlagsBits, ChannelType } = require('discord.js');
const Command = require('../Command.js');
const RotiEmbed = require('../../utils/embed.js');
const botConfig = require('../../config.js');

class MemechannelCommand extends Command {
  constructor() {
    super({
      name: 'memechannel',
      description: 'Set or remove designated auto meme channel for server',
      category: 'Server',
      usage: 'memechannel <set/remove> [channel]',
      userPermissions: [PermissionFlagsBits.ManageGuild],
      slashData: new SlashCommandBuilder()
        .setName('memechannel')
        .setDescription('Set designated meme channel')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
        .addSubcommand(sub => sub.setName('set').setDescription('Set a channel for memes').addChannelOption(opt => opt.setName('channel').setDescription('Channel').addChannelTypes(ChannelType.GuildText).setRequired(true)))
        .addSubcommand(sub => sub.setName('remove').setDescription('Remove the meme channel'))
    });
  }

  async execute(ctx, args) {
    const sub = ctx.isSlash ? ctx.raw.options.getSubcommand() : (args[0]?.toLowerCase() || 'set');

    if (sub === 'set') {
      const channel = ctx.isSlash ? ctx.raw.options.getChannel('channel') : (ctx.guild.channels.cache.get(args[1]?.replace(/<#|>/g, '')) || ctx.channel);
      ctx.client.db.updateGuild(ctx.guild.id, 'meme_channel_id', channel.id);
      return ctx.sendSuccess('Meme Channel Configured', `<#${channel.id}> has been set as the official meme channel!`);
    } else {
      ctx.client.db.updateGuild(ctx.guild.id, 'meme_channel_id', null);
      return ctx.sendSuccess('Meme Channel Removed', 'Designated meme channel has been unset.');
    }
  }
}

module.exports = MemechannelCommand;
