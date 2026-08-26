const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const Command = require('../Command.js');
const RotiEmbed = require('../../utils/embed.js');
const botConfig = require('../../config.js');

class InviteRolesCommand extends Command {
  constructor() {
    super({
      name: 'inviteroles',
      description: 'Configure automatic role rewards for reaching invite count milestones',
      category: 'Tracking',
      usage: 'inviteroles <add/remove/list> [invites] [role]',
      userPermissions: [PermissionFlagsBits.ManageGuild],
      slashData: new SlashCommandBuilder()
        .setName('inviteroles')
        .setDescription('Configure role rewards for invites')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
        .addSubcommand(sub => sub.setName('add').setDescription('Add invite role reward').addIntegerOption(opt => opt.setName('invites').setDescription('Invites required').setRequired(true)).addRoleOption(opt => opt.setName('role').setDescription('Role to award').setRequired(true)))
        .addSubcommand(sub => sub.setName('remove').setDescription('Remove invite role reward').addIntegerOption(opt => opt.setName('invites').setDescription('Invites milestone to remove').setRequired(true)))
        .addSubcommand(sub => sub.setName('list').setDescription('List all configured invite role rewards'))
    });
  }

  async execute(ctx, args) {
    const sub = ctx.isSlash ? ctx.raw.options.getSubcommand() : (args[0]?.toLowerCase() || 'list');
    const guild = ctx.guild;

    if (sub === 'add') {
      const invites = ctx.isSlash ? ctx.raw.options.getInteger('invites') : parseInt(args[1]);
      const role = ctx.isSlash ? ctx.raw.options.getRole('role') : (guild.roles.cache.get(args[2]?.replace(/<@&|>/g, '')));

      if (!invites || !role) return ctx.sendError('Invalid Usage', 'Usage: `?inviteroles add <invite_count> <@role>`');

      ctx.client.db.prepare(`
        INSERT OR REPLACE INTO invite_roles (guild_id, invites_needed, role_id)
        VALUES (?, ?, ?)
      `).run(guild.id, invites, role.id);

      return ctx.sendSuccess('Invite Role Added', `Members will now automatically receive **${role.name}** (<@&${role.id}>) upon reaching **${invites}** net invites!`);
    }

    if (sub === 'remove') {
      const invites = ctx.isSlash ? ctx.raw.options.getInteger('invites') : parseInt(args[1]);
      if (!invites) return ctx.sendError('Invalid Usage', 'Usage: `?inviteroles remove <invite_count>`');

      ctx.client.db.prepare('DELETE FROM invite_roles WHERE guild_id = ? AND invites_needed = ?').run(guild.id, invites);
      return ctx.sendSuccess('Invite Role Removed', `Removed invite reward for **${invites}** invites.`);
    }

    if (sub === 'list') {
      const list = ctx.client.db.prepare('SELECT * FROM invite_roles WHERE guild_id = ? ORDER BY invites_needed ASC').all(guild.id);
      if (list.length === 0) return ctx.reply({ embeds: [RotiEmbed.info('Invite Roles', 'No invite role rewards currently configured.')] });

      const formatted = list.map(r => `**${r.invites_needed} Invites:** <@&${r.role_id}>`).join('\n');
      const embed = new RotiEmbed()
        .setTitle(`🎁 Invite Role Rewards: ${guild.name}`)
        .setDescription(formatted)
        .setColor(botConfig.colors.teal);

      return ctx.reply({ embeds: [embed] });
    }
  }
}

module.exports = InviteRolesCommand;
