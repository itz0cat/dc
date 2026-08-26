const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const Command = require('../Command.js');
const RotiEmbed = require('../../utils/embed.js');
const botConfig = require('../../config.js');

class AutoroleCommand extends Command {
  constructor() {
    super({
      name: 'autorole',
      description: 'Set or remove a role automatically assigned to new members when they join',
      category: 'Roles',
      usage: 'autorole <set/remove/view> [role]',
      userPermissions: [PermissionFlagsBits.ManageRoles],
      botPermissions: [PermissionFlagsBits.ManageRoles],
      slashData: new SlashCommandBuilder()
        .setName('autorole')
        .setDescription('Set automatic role for new members')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles)
        .addSubcommand(sub => sub.setName('set').setDescription('Set autorole').addRoleOption(opt => opt.setName('role').setDescription('Role').setRequired(true)))
        .addSubcommand(sub => sub.setName('remove').setDescription('Remove autorole'))
        .addSubcommand(sub => sub.setName('view').setDescription('View current autorole'))
    });
  }

  async execute(ctx, args) {
    const sub = ctx.isSlash ? ctx.raw.options.getSubcommand() : (args[0]?.toLowerCase() || 'view');
    const guild = ctx.guild;

    if (sub === 'set') {
      const role = ctx.isSlash ? ctx.raw.options.getRole('role') : (guild.roles.cache.get(args[1]?.replace(/<@&|>/g, '')));
      if (!role) return ctx.sendError('Missing Role', 'Please specify a role.');

      ctx.client.db.prepare(`
        INSERT OR REPLACE INTO button_roles (guild_id, channel_id, message_id, role_id, type)
        VALUES (?, 'autorole', 'autorole', ?, 'autorole')
      `).run(guild.id, role.id);

      return ctx.sendSuccess('Autorole Set', `New members will automatically receive **${role.name}** (<@&${role.id}>) upon joining!`);
    }

    if (sub === 'remove') {
      ctx.client.db.prepare("DELETE FROM button_roles WHERE guild_id = ? AND type = 'autorole'").run(guild.id);
      return ctx.sendSuccess('Autorole Removed', 'Automatic role assignment for new members has been disabled.');
    }

    if (sub === 'view') {
      const auto = ctx.client.db.prepare("SELECT role_id FROM button_roles WHERE guild_id = ? AND type = 'autorole'").pluck().get(guild.id);
      const embed = new RotiEmbed()
        .setTitle('🎭 Server AutoRole')
        .setDescription(auto ? `Current AutoRole: <@&${auto}>` : '*No AutoRole currently configured.*')
        .setColor(botConfig.colors.teal);
      return ctx.reply({ embeds: [embed] });
    }
  }
}

module.exports = AutoroleCommand;
