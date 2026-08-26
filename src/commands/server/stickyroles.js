const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const Command = require('../Command.js');
const RotiEmbed = require('../../utils/embed.js');
const botConfig = require('../../config.js');

class StickyrolesCommand extends Command {
  constructor() {
    super({
      name: 'stickyroles',
      description: 'Configure sticky roles for your server (re-assigns roles when user leaves & rejoins)',
      category: 'Server',
      usage: 'stickyroles [on/off]',
      userPermissions: [PermissionFlagsBits.ManageGuild],
      slashData: new SlashCommandBuilder()
        .setName('stickyroles')
        .setDescription('Configure sticky roles for your server')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
        .addStringOption(opt => opt.setName('state').setDescription('Enable or disable sticky roles').addChoices({ name: 'Enable (On)', value: 'on' }, { name: 'Disable (Off)', value: 'off' }))
    });
  }

  async execute(ctx, args) {
    let state = ctx.isSlash ? ctx.raw.options.getString('state') : args[0]?.toLowerCase();
    
    if (state === 'on' || state === 'enable') {
      ctx.client.db.updateGuild(ctx.guild.id, 'sticky_roles_enabled', 1);
      return ctx.sendSuccess('Sticky Roles Enabled', 'Members who leave the server will now automatically have their previous roles restored when they rejoin.');
    } else if (state === 'off' || state === 'disable') {
      ctx.client.db.updateGuild(ctx.guild.id, 'sticky_roles_enabled', 0);
      return ctx.sendSuccess('Sticky Roles Disabled', 'Sticky roles feature has been turned off.');
    }

    const current = ctx.client.db.getGuild(ctx.guild.id);
    const embed = new RotiEmbed()
      .setTitle('📌 Sticky Roles Status')
      .setDescription(`Sticky roles are currently **${current.sticky_roles_enabled ? 'Enabled' : 'Disabled'}**.\nUse \`/stickyroles state:on\` or \`/stickyroles state:off\` to toggle.`)
      .setColor(botConfig.colors.teal);
    return ctx.reply({ embeds: [embed] });
  }
}

module.exports = StickyrolesCommand;
