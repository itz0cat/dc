const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const Command = require('../Command.js');
const RotiEmbed = require('../../utils/embed.js');
const botConfig = require('../../config.js');

class RoleCommand extends Command {
  constructor() {
    super({
      name: 'role',
      description: 'Manage, create, delete, inspect, or list server roles',
      category: 'Roles',
      aliases: ['roles'],
      usage: 'role <create/delete/update/info/members/list/removeall> [options]',
      userPermissions: [PermissionFlagsBits.ManageRoles],
      botPermissions: [PermissionFlagsBits.ManageRoles],
      slashData: new SlashCommandBuilder()
        .setName('role')
        .setDescription('Role administration commands')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles)
        .addSubcommand(sub => sub.setName('create').setDescription('Create a new role').addStringOption(opt => opt.setName('name').setDescription('Role name').setRequired(true)).addStringOption(opt => opt.setName('color').setDescription('Hex color code (e.g. #00A896)')))
        .addSubcommand(sub => sub.setName('delete').setDescription('Delete a role').addRoleOption(opt => opt.setName('role').setDescription('Role to delete').setRequired(true)))
        .addSubcommand(sub => sub.setName('update').setDescription('Add or remove role from a user').addUserOption(opt => opt.setName('user').setDescription('Target member').setRequired(true)).addRoleOption(opt => opt.setName('role').setDescription('Role').setRequired(true)))
        .addSubcommand(sub => sub.setName('info').setDescription('Display details of a role').addRoleOption(opt => opt.setName('role').setDescription('Role').setRequired(true)))
        .addSubcommand(sub => sub.setName('members').setDescription('List members with a specific role').addRoleOption(opt => opt.setName('role').setDescription('Role').setRequired(true)))
        .addSubcommand(sub => sub.setName('list').setDescription('List all server roles'))
        .addSubcommand(sub => sub.setName('removeall').setDescription('Remove a role from all members').addRoleOption(opt => opt.setName('role').setDescription('Role').setRequired(true)))
    });
  }

  async execute(ctx, args) {
    const sub = ctx.isSlash ? ctx.raw.options.getSubcommand() : (args[0]?.toLowerCase() || 'list');
    const guild = ctx.guild;

    if (sub === 'create') {
      const name = ctx.isSlash ? ctx.raw.options.getString('name') : args[1];
      const color = ctx.isSlash ? ctx.raw.options.getString('color') : args[2];
      if (!name) return ctx.sendError('Missing Name', 'Please specify a role name.');

      const newRole = await guild.roles.create({
        name,
        color: color || botConfig.colors.teal,
        reason: `Created by ${ctx.user.tag}`
      });

      return ctx.sendSuccess('Role Created', `Created new role **${newRole.name}** (<@&${newRole.id}>)!`);
    }

    if (sub === 'delete') {
      const role = ctx.isSlash ? ctx.raw.options.getRole('role') : (guild.roles.cache.get(args[1]?.replace(/<@&|>/g, '')));
      if (!role) return ctx.sendError('Missing Role', 'Please specify a role to delete.');

      const roleName = role.name;
      await role.delete(`Deleted by ${ctx.user.tag}`);
      return ctx.sendSuccess('Role Deleted', `Role **${roleName}** has been removed.`);
    }

    if (sub === 'update') {
      const targetUser = ctx.isSlash ? ctx.raw.options.getUser('user') : ctx.raw.mentions.users.first();
      const role = ctx.isSlash ? ctx.raw.options.getRole('role') : (guild.roles.cache.get(args[2]?.replace(/<@&|>/g, '')));
      if (!targetUser || !role) return ctx.sendError('Missing Parameters', 'Usage: `role update <user> <role>`');

      const member = guild.members.cache.get(targetUser.id);
      if (!member) return ctx.sendError('Not in Server', 'Member is not in the server.');

      if (member.roles.cache.has(role.id)) {
        await member.roles.remove(role, `Role revoked by ${ctx.user.tag}`);
        return ctx.sendSuccess('Role Removed', `Removed **${role.name}** from <@${targetUser.id}>.`);
      } else {
        await member.roles.add(role, `Role assigned by ${ctx.user.tag}`);
        return ctx.sendSuccess('Role Assigned', `Added **${role.name}** to <@${targetUser.id}>.`);
      }
    }

    if (sub === 'info') {
      const role = ctx.isSlash ? ctx.raw.options.getRole('role') : (guild.roles.cache.get(args[1]?.replace(/<@&|>/g, '')));
      if (!role) return ctx.sendError('Missing Role', 'Please specify a role.');

      const embed = new RotiEmbed()
        .setTitle(`🎭 Role: ${role.name}`)
        .addFields(
          { name: 'Role ID', value: `\`${role.id}\``, inline: true },
          { name: 'Color Hex', value: `\`${role.hexColor}\``, inline: true },
          { name: 'Members', value: `${role.members.size}`, inline: true },
          { name: 'Hoisted', value: role.hoist ? 'Yes' : 'No', inline: true },
          { name: 'Mentionable', value: role.mentionable ? 'Yes' : 'No', inline: true },
          { name: 'Created', value: `<t:${Math.floor(role.createdTimestamp / 1000)}:R>`, inline: true }
        )
        .setColor(role.color || botConfig.colors.teal);
      return ctx.reply({ embeds: [embed] });
    }

    if (sub === 'members') {
      const role = ctx.isSlash ? ctx.raw.options.getRole('role') : (guild.roles.cache.get(args[1]?.replace(/<@&|>/g, '')));
      if (!role) return ctx.sendError('Missing Role', 'Please specify a role.');

      const membersList = role.members.map(m => `<@${m.id}>`).slice(0, 50).join(', ') || '*No members have this role.*';
      const embed = new RotiEmbed()
        .setTitle(`👥 Members with ${role.name} (${role.members.size})`)
        .setDescription(membersList)
        .setColor(botConfig.colors.teal);
      return ctx.reply({ embeds: [embed] });
    }

    if (sub === 'list') {
      const roles = guild.roles.cache.filter(r => r.id !== guild.id).sort((a, b) => b.position - a.position);
      const list = roles.map(r => `<@&${r.id}>`).slice(0, 40).join(', ') || '*No roles found.*';

      const embed = new RotiEmbed()
        .setTitle(`📋 Server Roles (${roles.size})`)
        .setDescription(list)
        .setColor(botConfig.colors.teal);
      return ctx.reply({ embeds: [embed] });
    }

    if (sub === 'removeall') {
      const role = ctx.isSlash ? ctx.raw.options.getRole('role') : (guild.roles.cache.get(args[1]?.replace(/<@&|>/g, '')));
      if (!role) return ctx.sendError('Missing Role', 'Please specify a role.');

      let removed = 0;
      for (const [, member] of role.members) {
        await member.roles.remove(role, `Mass role removal by ${ctx.user.tag}`).catch(() => {});
        removed++;
      }
      return ctx.sendSuccess('Role Removed from All', `Removed **${role.name}** from **${removed}** members.`);
    }
  }
}

module.exports = RoleCommand;
