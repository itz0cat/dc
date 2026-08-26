const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const Command = require('../Command.js');
const RotiEmbed = require('../../utils/embed.js');
const botConfig = require('../../config.js');

class ModroleCommand extends Command {
  constructor() {
    super({
      name: 'modrole',
      description: 'Set, remove, or view the moderation role for R.O.T.I commands',
      category: 'Server',
      usage: 'modrole <set/remove/view> [role]',
      userPermissions: [PermissionFlagsBits.Administrator],
      slashData: new SlashCommandBuilder()
        .setName('modrole')
        .setDescription('Manage moderator role')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .addSubcommand(sub => sub.setName('set').setDescription('Set moderation role').addRoleOption(opt => opt.setName('role').setDescription('Role').setRequired(true)))
        .addSubcommand(sub => sub.setName('remove').setDescription('Remove current moderation role'))
        .addSubcommand(sub => sub.setName('view').setDescription('Displays the current moderation role'))
    });
  }

  async execute(ctx, args) {
    const sub = ctx.isSlash ? ctx.raw.options.getSubcommand() : (args[0]?.toLowerCase() || 'view');

    if (sub === 'set') {
      const role = ctx.isSlash ? ctx.raw.options.getRole('role') : (ctx.guild.roles.cache.get(args[1]?.replace(/<@&|>/g, '')) || ctx.guild.roles.cache.find(r => r.name.toLowerCase() === args.slice(1).join(' ').toLowerCase()));
      if (!role) return ctx.sendError('Invalid Role', 'Please provide a valid role.');

      ctx.client.db.updateGuild(ctx.guild.id, 'mod_role_id', role.id);
      return ctx.sendSuccess('Mod Role Set', `Moderator role has been set to **${role.name}** (<@&${role.id}>).`);
    } else if (sub === 'remove') {
      ctx.client.db.updateGuild(ctx.guild.id, 'mod_role_id', null);
      return ctx.sendSuccess('Mod Role Removed', 'Moderator role requirement has been removed.');
    } else {
      const settings = ctx.client.db.getGuild(ctx.guild.id);
      const embed = new RotiEmbed()
        .setTitle('🛡️ Moderation Role')
        .setDescription(settings.mod_role_id ? `Current moderator role: <@&${settings.mod_role_id}>` : '*No moderator role set.*')
        .setColor(botConfig.colors.teal);
      return ctx.reply({ embeds: [embed] });
    }
  }
}

module.exports = ModroleCommand;
