const { SlashCommandBuilder, PermissionFlagsBits, ChannelType, ActionRowBuilder, StringSelectMenuBuilder } = require('discord.js');
const Command = require('../Command.js');
const RotiEmbed = require('../../utils/embed.js');
const botConfig = require('../../config.js');

class SelectroleCommand extends Command {
  constructor() {
    super({
      name: 'selectrole',
      description: 'Create a dropdown select menu allowing users to choose their self roles',
      category: 'Roles',
      usage: 'selectrole <roles...> [placeholder] [channel]',
      userPermissions: [PermissionFlagsBits.ManageRoles],
      botPermissions: [PermissionFlagsBits.ManageRoles],
      slashData: new SlashCommandBuilder()
        .setName('selectrole')
        .setDescription('Create a dropdown select menu for self roles')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles)
        .addStringOption(opt => opt.setName('roles').setDescription('Role IDs or mentions separated by space').setRequired(true))
        .addStringOption(opt => opt.setName('placeholder').setDescription('Placeholder text for dropdown'))
        .addChannelOption(opt => opt.setName('channel').setDescription('Channel to post menu').addChannelTypes(ChannelType.GuildText))
    });
  }

  async execute(ctx, args) {
    const rolesInput = ctx.isSlash ? ctx.raw.options.getString('roles') : args.join(' ');
    const placeholder = ctx.isSlash ? (ctx.raw.options.getString('placeholder') || 'Select your roles...') : 'Select your roles...';
    const channel = ctx.isSlash ? (ctx.raw.options.getChannel('channel') || ctx.channel) : ctx.channel;

    const roleIds = rolesInput.match(/\d{17,20}/g) || [];
    if (roleIds.length === 0) return ctx.sendError('Missing Roles', 'Please specify valid role IDs or role mentions.');

    const options = [];
    for (const rId of roleIds.slice(0, 25)) {
      const role = ctx.guild.roles.cache.get(rId);
      if (role) {
        options.push({
          label: role.name,
          value: role.id,
          description: `Toggle the ${role.name} role`
        });
      }
    }

    if (options.length === 0) return ctx.sendError('No Valid Roles', 'None of the provided roles were found in this server.');

    const embed = new RotiEmbed()
      .setTitle('🎭 Self Roles Menu')
      .setDescription('Select one or more roles from the menu below to add or remove them:')
      .setColor(botConfig.colors.teal);

    const selectMenu = new StringSelectMenuBuilder()
      .setCustomId('selectrole_menu')
      .setPlaceholder(placeholder)
      .setMinValues(1)
      .setMaxValues(options.length)
      .addOptions(options);

    const row = new ActionRowBuilder().addComponents(selectMenu);

    await channel.send({ embeds: [embed], components: [row] });
    return ctx.sendSuccess('Select Role Created', `Dropdown role menu posted in <#${channel.id}> with **${options.length}** role options!`);
  }
}

module.exports = SelectroleCommand;
