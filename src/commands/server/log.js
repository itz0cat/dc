const { SlashCommandBuilder, PermissionFlagsBits, ChannelType } = require('discord.js');
const Command = require('../Command.js');
const RotiEmbed = require('../../utils/embed.js');
const botConfig = require('../../config.js');

class LogCommand extends Command {
  constructor() {
    super({
      name: 'log',
      description: 'Configure logging of various server events (mod logs, joins, edits, deletes)',
      category: 'Server',
      aliases: ['logs', 'setlogs'],
      usage: 'log <set/disable/view> [channel]',
      userPermissions: [PermissionFlagsBits.ManageGuild],
      slashData: new SlashCommandBuilder()
        .setName('log')
        .setDescription('Configure server event log channel')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
        .addSubcommand(sub => sub.setName('set').setDescription('Set the server log channel').addChannelOption(opt => opt.setName('channel').setDescription('Log channel').addChannelTypes(ChannelType.GuildText).setRequired(true)))
        .addSubcommand(sub => sub.setName('disable').setDescription('Disable server event logging'))
        .addSubcommand(sub => sub.setName('view').setDescription('View current log settings'))
    });
  }

  async execute(ctx, args) {
    const sub = ctx.isSlash ? ctx.raw.options.getSubcommand() : (args[0]?.toLowerCase() || 'set');

    if (sub === 'set') {
      const channel = ctx.isSlash ? ctx.raw.options.getChannel('channel') : (ctx.guild.channels.cache.get(args[1]?.replace(/<#|>/g, '')) || ctx.channel);
      ctx.client.db.updateGuild(ctx.guild.id, 'log_channel_id', channel.id);
      return ctx.sendSuccess('Log Channel Set', `Server activity, mod actions, member joins, and message edits/deletions will be logged to <#${channel.id}>!`);
    } else if (sub === 'disable') {
      ctx.client.db.updateGuild(ctx.guild.id, 'log_channel_id', null);
      return ctx.sendSuccess('Logging Disabled', 'Server event logging has been disabled.');
    } else {
      const settings = ctx.client.db.getGuild(ctx.guild.id);
      const embed = new RotiEmbed()
        .setTitle('📜 Server Logging Status')
        .setDescription(settings.log_channel_id ? `Currently logging to <#${settings.log_channel_id}>` : '*Logging is currently disabled.*')
        .setColor(botConfig.colors.teal);
      return ctx.reply({ embeds: [embed] });
    }
  }
}

module.exports = LogCommand;
