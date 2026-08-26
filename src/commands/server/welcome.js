const { SlashCommandBuilder, PermissionFlagsBits, ChannelType } = require('discord.js');
const Command = require('../Command.js');
const RotiEmbed = require('../../utils/embed.js');
const botConfig = require('../../config.js');

class WelcomeCommand extends Command {
  constructor() {
    super({
      name: 'welcome',
      description: 'Configure custom welcome messages for your server',
      category: 'Server',
      aliases: ['setwelcome'],
      usage: 'welcome [channel] [message]',
      userPermissions: [PermissionFlagsBits.ManageGuild],
      slashData: new SlashCommandBuilder()
        .setName('welcome')
        .setDescription('Configure custom welcome messages for your server')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
        .addChannelOption(opt => opt.setName('channel').setDescription('Channel to send welcome messages').addChannelTypes(ChannelType.GuildText))
        .addStringOption(opt => opt.setName('message').setDescription('Custom welcome message (Variables: ?member, ?username, ?tag, ?size, ?server)'))
        .addBooleanOption(opt => opt.setName('embed').setDescription('Send welcome message as an embed (true/false)'))
        .addStringOption(opt => opt.setName('image').setDescription('Direct image URL to attach to welcome embed'))
    });
  }

  async execute(ctx, args) {
    let channel = null;
    let message = null;
    let isEmbed = true;
    let image = null;

    if (ctx.isSlash) {
      channel = ctx.raw.options.getChannel('channel');
      message = ctx.raw.options.getString('message');
      isEmbed = ctx.raw.options.getBoolean('embed') ?? true;
      image = ctx.raw.options.getString('image');
    } else {
      if (args[0]) {
        const chanId = args[0].replace(/<#|>/g, '');
        channel = ctx.guild.channels.cache.get(chanId);
      }
      if (args.length > 1) {
        message = args.slice(1).join(' ');
      }
    }

    if (channel) {
      ctx.client.db.updateGuild(ctx.guild.id, 'welcome_channel_id', channel.id);
    }
    if (message) {
      ctx.client.db.updateGuild(ctx.guild.id, 'welcome_message', message);
    }
    if (image) {
      ctx.client.db.updateGuild(ctx.guild.id, 'welcome_image', image);
    }
    ctx.client.db.updateGuild(ctx.guild.id, 'welcome_embed', isEmbed ? 1 : 0);

    const current = ctx.client.db.getGuild(ctx.guild.id);
    const embed = new RotiEmbed()
      .setTitle('👋 Welcome System Configuration')
      .setDescription('Custom welcome messages have been updated successfully!')
      .addFields(
        { name: 'Channel', value: current.welcome_channel_id ? `<#${current.welcome_channel_id}>` : '*Not Set*', inline: true },
        { name: 'Embed Mode', value: current.welcome_embed ? 'Enabled' : 'Disabled', inline: true },
        { name: 'Message Template', value: `\`\`\`${current.welcome_message}\`\`\``, inline: false },
        { name: 'Available Placeholders', value: '`?member` - Mention member\n`?username` - Member username\n`?tag` - Member tag\n`?server` - Server name\n`?size` - Total members', inline: false }
      )
      .setColor(botConfig.colors.teal);

    return ctx.reply({ embeds: [embed] });
  }
}

module.exports = WelcomeCommand;
