const { SlashCommandBuilder, PermissionFlagsBits, ChannelType } = require('discord.js');
const Command = require('../Command.js');
const RotiEmbed = require('../../utils/embed.js');
const botConfig = require('../../config.js');

class AnnounceCommand extends Command {
  constructor() {
    super({
      name: 'announce',
      description: 'Announce a message to a channel with optional role mentions',
      category: 'Utility',
      usage: 'announce <channel> <message> [ping]',
      userPermissions: [PermissionFlagsBits.MentionEveryone],
      slashData: new SlashCommandBuilder()
        .setName('announce')
        .setDescription('Announce a message in a channel')
        .setDefaultMemberPermissions(PermissionFlagsBits.MentionEveryone)
        .addChannelOption(opt => opt.setName('channel').setDescription('Channel to post in').addChannelTypes(ChannelType.GuildText).setRequired(true))
        .addStringOption(opt => opt.setName('message').setDescription('Announcement message text').setRequired(true))
        .addStringOption(opt => opt.setName('ping').setDescription('Ping type').addChoices({ name: '@everyone', value: '@everyone' }, { name: '@here', value: '@here' }, { name: 'None', value: 'none' }))
    });
  }

  async execute(ctx, args) {
    const channel = ctx.isSlash ? ctx.raw.options.getChannel('channel') : ctx.guild.channels.cache.get(args[0]?.replace(/<#|>/g, ''));
    const message = ctx.isSlash ? ctx.raw.options.getString('message') : args.slice(1).join(' ');
    const ping = ctx.isSlash ? (ctx.raw.options.getString('ping') || 'none') : 'none';

    if (!channel || !message) {
      return ctx.sendError('Missing Parameters', 'Usage: `announce <channel> <message>`');
    }

    const embed = new RotiEmbed()
      .setTitle('📢 Server Announcement')
      .setDescription(message)
      .setFooter({ text: `Announced by ${ctx.user.tag} • ${botConfig.footerText}` })
      .setColor(botConfig.colors.teal);

    let content = null;
    if (ping === '@everyone') content = '@everyone';
    if (ping === '@here') content = '@here';

    await channel.send({ content, embeds: [embed] });
    return ctx.sendSuccess('Announcement Sent', `Announcement posted in <#${channel.id}>!`);
  }
}

module.exports = AnnounceCommand;
