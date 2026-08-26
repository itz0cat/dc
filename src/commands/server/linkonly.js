const { SlashCommandBuilder, PermissionFlagsBits, ChannelType } = require('discord.js');
const Command = require('../Command.js');
const RotiEmbed = require('../../utils/embed.js');
const botConfig = require('../../config.js');

class LinkonlyCommand extends Command {
  constructor() {
    super({
      name: 'linkonly',
      description: 'Manage link-only channels (only messages containing links are allowed)',
      category: 'Server',
      usage: 'linkonly <on/off/list> [channel]',
      userPermissions: [PermissionFlagsBits.ManageChannels],
      slashData: new SlashCommandBuilder()
        .setName('linkonly')
        .setDescription('Manage link-only channels')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels)
        .addSubcommand(sub => sub.setName('on').setDescription('Enable link-only mode for a channel').addChannelOption(opt => opt.setName('channel').setDescription('Channel').addChannelTypes(ChannelType.GuildText).setRequired(true)))
        .addSubcommand(sub => sub.setName('off').setDescription('Disable link-only mode for a channel').addChannelOption(opt => opt.setName('channel').setDescription('Channel').addChannelTypes(ChannelType.GuildText).setRequired(true)))
        .addSubcommand(sub => sub.setName('list').setDescription('Displays a list of link-only channels'))
    });
  }

  async execute(ctx, args) {
    const sub = ctx.isSlash ? ctx.raw.options.getSubcommand() : (args[0]?.toLowerCase() || 'list');
    const guildSettings = ctx.client.db.getGuild(ctx.guild.id);
    let channels = (guildSettings.link_only_channels || '').split(',').filter(Boolean);

    if (sub === 'on') {
      const targetChannel = ctx.isSlash ? ctx.raw.options.getChannel('channel') : (ctx.guild.channels.cache.get(args[1]?.replace(/<#|>/g, '')) || ctx.channel);
      if (!channels.includes(targetChannel.id)) {
        channels.push(targetChannel.id);
        ctx.client.db.updateGuild(ctx.guild.id, 'link_only_channels', channels.join(','));
      }
      return ctx.sendSuccess('Link-Only Enabled', `<#${targetChannel.id}> is now a **Link-Only** channel! Messages without links will be auto-deleted.`);
    } else if (sub === 'off') {
      const targetChannel = ctx.isSlash ? ctx.raw.options.getChannel('channel') : (ctx.guild.channels.cache.get(args[1]?.replace(/<#|>/g, '')) || ctx.channel);
      channels = channels.filter(id => id !== targetChannel.id);
      ctx.client.db.updateGuild(ctx.guild.id, 'link_only_channels', channels.join(','));
      return ctx.sendSuccess('Link-Only Disabled', `<#${targetChannel.id}> is no longer link-only.`);
    } else {
      const list = channels.map(id => `<#${id}>`).join('\n') || '*No link-only channels configured.*';
      const embed = new RotiEmbed()
        .setTitle('🔗 Link-Only Channels')
        .setDescription(list)
        .setColor(botConfig.colors.teal);
      return ctx.reply({ embeds: [embed] });
    }
  }
}

module.exports = LinkonlyCommand;
