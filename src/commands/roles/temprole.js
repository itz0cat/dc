const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const Command = require('../Command.js');
const RotiEmbed = require('../../utils/embed.js');
const botConfig = require('../../config.js');
const { parseDuration, formatDuration } = require('../../utils/time.js');

class TemproleCommand extends Command {
  constructor() {
    super({
      name: 'temprole',
      description: 'Assign a temporary role to a user for a set duration',
      category: 'Roles',
      usage: 'temprole <user> <role> <duration>',
      userPermissions: [PermissionFlagsBits.ManageRoles],
      botPermissions: [PermissionFlagsBits.ManageRoles],
      slashData: new SlashCommandBuilder()
        .setName('temprole')
        .setDescription('Assign temporary role to a member')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles)
        .addUserOption(opt => opt.setName('user').setDescription('Target member').setRequired(true))
        .addRoleOption(opt => opt.setName('role').setDescription('Role to assign').setRequired(true))
        .addStringOption(opt => opt.setName('duration').setDescription('Duration (e.g. 1h, 1d, 7d)').setRequired(true))
    });
  }

  async execute(ctx, args) {
    const targetUser = ctx.isSlash ? ctx.raw.options.getUser('user') : ctx.raw.mentions.users.first();
    const role = ctx.isSlash ? ctx.raw.options.getRole('role') : (ctx.guild.roles.cache.get(args[1]?.replace(/<@&|>/g, '')));
    const durationStr = ctx.isSlash ? ctx.raw.options.getString('duration') : args[2];

    if (!targetUser || !role || !durationStr) {
      return ctx.sendError('Missing Parameters', 'Usage: `temprole <user> <role> <duration>`');
    }

    const member = ctx.guild.members.cache.get(targetUser.id);
    if (!member) return ctx.sendError('Not in Server', 'Member is not in the server.');

    const durationMs = parseDuration(durationStr);
    if (!durationMs) return ctx.sendError('Invalid Duration', 'Invalid duration. Example: `1h`, `12h`, `7d`.');

    await member.roles.add(role, `Temprole for ${formatDuration(durationMs)} by ${ctx.user.tag}`);

    const expiresAt = Date.now() + durationMs;
    ctx.client.db.prepare(`
      INSERT INTO temproles (guild_id, user_id, role_id, expires_at)
      VALUES (?, ?, ?, ?)
    `).run(ctx.guild.id, targetUser.id, role.id, expiresAt);

    const embed = new RotiEmbed()
      .setTitle('⏱️ Temporary Role Assigned')
      .setDescription(`Given role **${role.name}** to <@${targetUser.id}> for **${formatDuration(durationMs)}**.\nExpires: <t:${Math.floor(expiresAt / 1000)}:R>`)
      .setColor(botConfig.colors.teal);

    return ctx.reply({ embeds: [embed] });
  }
}

module.exports = TemproleCommand;
