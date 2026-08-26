const { SlashCommandBuilder, PermissionFlagsBits, ChannelType } = require('discord.js');
const Command = require('../Command.js');
const RotiEmbed = require('../../utils/embed.js');
const botConfig = require('../../config.js');

class StarboardCommand extends Command {
  constructor() {
    super({
      name: 'starboard',
      description: 'Configure starboard channel, threshold, and ignored channels',
      category: 'Server',
      usage: 'starboard <set/enable/disable/ignore> [channel] [threshold]',
      userPermissions: [PermissionFlagsBits.ManageGuild],
      slashData: new SlashCommandBuilder()
        .setName('starboard')
        .setDescription('Configure starboard')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
        .addSubcommand(sub => sub.setName('set').setDescription('Set starboard channel and threshold').addChannelOption(opt => opt.setName('channel').setDescription('Starboard channel').addChannelTypes(ChannelType.GuildText).setRequired(true)).addIntegerOption(opt => opt.setName('threshold').setDescription('Star reaction count needed (default: 3)')))
        .addSubcommand(sub => sub.setName('enable').setDescription('Enable Starboard'))
        .addSubcommand(sub => sub.setName('disable').setDescription('Disable Starboard'))
        .addSubcommand(sub => sub.setName('ignore').setDescription('Add/Remove channel from starboard monitoring').addChannelOption(opt => opt.setName('channel').setDescription('Channel to ignore/unignore').addChannelTypes(ChannelType.GuildText).setRequired(true)))
    });
  }

  async execute(ctx, args) {
    const sub = ctx.isSlash ? ctx.raw.options.getSubcommand() : (args[0]?.toLowerCase() || 'set');
    const settings = ctx.client.db.getGuild(ctx.guild.id);

    if (sub === 'set') {
      const channel = ctx.isSlash ? ctx.raw.options.getChannel('channel') : (ctx.guild.channels.cache.get(args[1]?.replace(/<#|>/g, '')) || ctx.channel);
      const threshold = ctx.isSlash ? (ctx.raw.options.getInteger('threshold') || 3) : (parseInt(args[2]) || 3);

      ctx.client.db.updateGuild(ctx.guild.id, 'starboard_channel_id', channel.id);
      ctx.client.db.updateGuild(ctx.guild.id, 'starboard_threshold', threshold);
      ctx.client.db.updateGuild(ctx.guild.id, 'starboard_enabled', 1);

      return ctx.sendSuccess('Starboard Configured', `Starboard channel set to <#${channel.id}> with threshold **${threshold} ⭐**!`);
    } else if (sub === 'enable') {
      ctx.client.db.updateGuild(ctx.guild.id, 'starboard_enabled', 1);
      return ctx.sendSuccess('Starboard Enabled', 'Starboard system is now active.');
    } else if (sub === 'disable') {
      ctx.client.db.updateGuild(ctx.guild.id, 'starboard_enabled', 0);
      return ctx.sendSuccess('Starboard Disabled', 'Starboard system has been deactivated.');
    } else if (sub === 'ignore') {
      const channel = ctx.isSlash ? ctx.raw.options.getChannel('channel') : (ctx.guild.channels.cache.get(args[1]?.replace(/<#|>/g, '')) || ctx.channel);
      let ignored = (settings.starboard_ignored_channels || '').split(',').filter(Boolean);

      if (ignored.includes(channel.id)) {
        ignored = ignored.filter(id => id !== channel.id);
        ctx.client.db.updateGuild(ctx.guild.id, 'starboard_ignored_channels', ignored.join(','));
        return ctx.sendSuccess('Starboard Unignored', `<#${channel.id}> will now be monitored by starboard.`);
      } else {
        ignored.push(channel.id);
        ctx.client.db.updateGuild(ctx.guild.id, 'starboard_ignored_channels', ignored.join(','));
        return ctx.sendSuccess('Starboard Ignored', `<#${channel.id}> will now be ignored by starboard.`);
      }
    }
  }
}

module.exports = StarboardCommand;
