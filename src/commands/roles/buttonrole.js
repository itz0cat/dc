const { SlashCommandBuilder, PermissionFlagsBits, ChannelType, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const Command = require('../Command.js');
const RotiEmbed = require('../../utils/embed.js');
const botConfig = require('../../config.js');

class ButtonroleCommand extends Command {
  constructor() {
    super({
      name: 'buttonrole',
      description: 'Create an interactive button that assigns or removes a role when clicked',
      category: 'Roles',
      usage: 'buttonrole <role> [label] [emoji] [channel]',
      userPermissions: [PermissionFlagsBits.ManageRoles],
      botPermissions: [PermissionFlagsBits.ManageRoles],
      slashData: new SlashCommandBuilder()
        .setName('buttonrole')
        .setDescription('Create an interactive button role panel')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles)
        .addRoleOption(opt => opt.setName('role').setDescription('Role to assign').setRequired(true))
        .addStringOption(opt => opt.setName('label').setDescription('Button text label'))
        .addStringOption(opt => opt.setName('emoji').setDescription('Button emoji'))
        .addChannelOption(opt => opt.setName('channel').setDescription('Channel to send panel').addChannelTypes(ChannelType.GuildText))
    });
  }

  async execute(ctx, args) {
    const role = ctx.isSlash ? ctx.raw.options.getRole('role') : (ctx.guild.roles.cache.get(args[0]?.replace(/<@&|>/g, '')) || ctx.guild.roles.cache.find(r => r.name.toLowerCase() === args[0]?.toLowerCase()));
    if (!role) return ctx.sendError('Missing Role', 'Please specify a valid role.');

    const label = ctx.isSlash ? (ctx.raw.options.getString('label') || role.name) : (args[1] || role.name);
    const emoji = ctx.isSlash ? ctx.raw.options.getString('emoji') : args[2];
    const channel = ctx.isSlash ? (ctx.raw.options.getChannel('channel') || ctx.channel) : ctx.channel;

    const embed = new RotiEmbed()
      .setTitle('🎭 Self Role Assignment')
      .setDescription(`Click the button below to get or remove the **${role.name}** role!`)
      .setColor(botConfig.colors.teal);

    const btn = new ButtonBuilder()
      .setCustomId(`role_toggle:${role.id}`)
      .setLabel(label)
      .setStyle(ButtonStyle.Primary);

    if (emoji) btn.setEmoji(emoji);

    const row = new ActionRowBuilder().addComponents(btn);

    await channel.send({ embeds: [embed], components: [row] });
    return ctx.sendSuccess('Button Role Created', `Button role for **${role.name}** has been sent to <#${channel.id}>!`);
  }
}

module.exports = ButtonroleCommand;
