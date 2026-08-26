const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const Command = require('../Command.js');
const RotiEmbed = require('../../utils/embed.js');
const botConfig = require('../../config.js');
const { parseDuration, formatDuration } = require('../../utils/time.js');

class VoiceRolesCommand extends Command {
  constructor() {
    super({
      name: 'voiceroles',
      description: 'Configure automatic role rewards for reaching voice activity milestones',
      category: 'Tracking',
      usage: 'voiceroles <add/remove/list> [time] [role]',
      userPermissions: [PermissionFlagsBits.ManageGuild],
      slashData: new SlashCommandBuilder()
        .setName('voiceroles')
        .setDescription('Configure role rewards for voice time')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
        .addSubcommand(sub => sub.setName('add').setDescription('Add voice role reward').addStringOption(opt => opt.setName('time').setDescription('Voice time required (e.g. 5h, 1d, 10h)').setRequired(true)).addRoleOption(opt => opt.setName('role').setDescription('Role to award').setRequired(true)))
        .addSubcommand(sub => sub.setName('remove').setDescription('Remove voice role reward').addStringOption(opt => opt.setName('time').setDescription('Voice time milestone to remove').setRequired(true)))
        .addSubcommand(sub => sub.setName('list').setDescription('List all configured voice role rewards'))
    });
  }

  async execute(ctx, args) {
    const sub = ctx.isSlash ? ctx.raw.options.getSubcommand() : (args[0]?.toLowerCase() || 'list');
    const guild = ctx.guild;

    if (sub === 'add') {
      const timeStr = ctx.isSlash ? ctx.raw.options.getString('time') : args[1];
      const role = ctx.isSlash ? ctx.raw.options.getRole('role') : (guild.roles.cache.get(args[2]?.replace(/<@&|>/g, '')));

      const timeMs = parseDuration(timeStr);
      if (!timeMs || !role) return ctx.sendError('Invalid Usage', 'Usage: `?voiceroles add <duration e.g. 5h> <@role>`');

      ctx.client.db.prepare(`
        INSERT OR REPLACE INTO voice_roles (guild_id, time_needed_ms, role_id)
        VALUES (?, ?, ?)
      `).run(guild.id, timeMs, role.id);

      return ctx.sendSuccess('Voice Role Added', `Members will now automatically receive **${role.name}** (<@&${role.id}>) upon reaching **${formatDuration(timeMs)}** in voice channels!`);
    }

    if (sub === 'remove') {
      const timeStr = ctx.isSlash ? ctx.raw.options.getString('time') : args[1];
      const timeMs = parseDuration(timeStr);
      if (!timeMs) return ctx.sendError('Invalid Usage', 'Usage: `?voiceroles remove <duration>`');

      ctx.client.db.prepare('DELETE FROM voice_roles WHERE guild_id = ? AND time_needed_ms = ?').run(guild.id, timeMs);
      return ctx.sendSuccess('Voice Role Removed', `Removed voice reward for **${formatDuration(timeMs)}**.`);
    }

    if (sub === 'list') {
      const list = ctx.client.db.prepare('SELECT * FROM voice_roles WHERE guild_id = ? ORDER BY time_needed_ms ASC').all(guild.id);
      if (list.length === 0) return ctx.reply({ embeds: [RotiEmbed.info('Voice Roles', 'No voice role rewards currently configured.')] });

      const formatted = list.map(r => `**${formatDuration(r.time_needed_ms)}:** <@&${r.role_id}>`).join('\n');
      const embed = new RotiEmbed()
        .setTitle(`🎁 Voice Role Rewards: ${guild.name}`)
        .setDescription(formatted)
        .setColor(botConfig.colors.teal);

      return ctx.reply({ embeds: [embed] });
    }
  }
}

module.exports = VoiceRolesCommand;
