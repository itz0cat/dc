const { SlashCommandBuilder, PermissionFlagsBits, ChannelType } = require('discord.js');
const Command = require('../Command.js');
const RotiEmbed = require('../../utils/embed.js');
const botConfig = require('../../config.js');

class EmbedCommand extends Command {
  constructor() {
    super({
      name: 'embed',
      description: 'Create a custom embed in a channel with title, description, and color',
      category: 'Utility',
      usage: 'embed <channel> <title> | <description> | [color]',
      userPermissions: [PermissionFlagsBits.ManageMessages],
      slashData: new SlashCommandBuilder()
        .setName('embed')
        .setDescription('Create a custom embed')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
        .addChannelOption(opt => opt.setName('channel').setDescription('Channel to send embed').addChannelTypes(ChannelType.GuildText).setRequired(true))
        .addStringOption(opt => opt.setName('title').setDescription('Embed title').setRequired(true))
        .addStringOption(opt => opt.setName('description').setDescription('Embed description').setRequired(true))
        .addStringOption(opt => opt.setName('color').setDescription('Hex color code (e.g. #00A896)'))
        .addStringOption(opt => opt.setName('image').setDescription('Image URL'))
    });
  }

  async execute(ctx, args) {
    let channel = ctx.isSlash ? ctx.raw.options.getChannel('channel') : ctx.guild.channels.cache.get(args[0]?.replace(/<#|>/g, ''));
    let title = ctx.isSlash ? ctx.raw.options.getString('title') : null;
    let desc = ctx.isSlash ? ctx.raw.options.getString('description') : null;
    let color = ctx.isSlash ? ctx.raw.options.getString('color') : null;
    let image = ctx.isSlash ? ctx.raw.options.getString('image') : null;

    if (!ctx.isSlash) {
      const rest = args.slice(1).join(' ').split('|');
      title = rest[0]?.trim();
      desc = rest[1]?.trim();
      color = rest[2]?.trim();
    }

    if (!channel || !title || !desc) {
      return ctx.sendError('Missing Parameters', 'Usage: `embed <channel> <title> | <description> | [color]`');
    }

    const embed = new RotiEmbed()
      .setTitle(title)
      .setDescription(desc)
      .setColor(color || botConfig.colors.teal);

    if (image) embed.setImage(image);

    await channel.send({ embeds: [embed] });
    return ctx.sendSuccess('Embed Sent', `Custom embed has been posted in <#${channel.id}>!`);
  }
}

module.exports = EmbedCommand;
