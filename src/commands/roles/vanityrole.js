const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const Command = require('../Command.js');
const RotiEmbed = require('../../utils/embed.js');
const botConfig = require('../../config.js');

class VanityRoleCommand extends Command {
  constructor() {
    super({
      name: 'vanityrole',
      description: 'Automatically reward members who place your server vanity or invite in their custom status',
      category: 'Roles',
      aliases: ['statusrole', 'customstatusrole'],
      usage: 'vanityrole <set/remove/view> [vanity_text] [role]',
      userPermissions: [PermissionFlagsBits.ManageRoles],
      botPermissions: [PermissionFlagsBits.ManageRoles],
      slashData: new SlashCommandBuilder()
        .setName('vanityrole')
        .setDescription('Reward members with vanity in status')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles)
        .addSubcommand(sub => sub.setName('set').setDescription('Set vanity status role').addStringOption(opt => opt.setName('vanity').setDescription('Vanity text (e.g. .gg/server or discord.gg/cat)').setRequired(true)).addRoleOption(opt => opt.setName('role').setDescription('Role to reward').setRequired(true)))
        .addSubcommand(sub => sub.setName('remove').setDescription('Remove vanity status role'))
        .addSubcommand(sub => sub.setName('view').setDescription('View vanity status role config'))
    });
  }

  async execute(ctx, args) {
    const sub = ctx.isSlash ? ctx.raw.options.getSubcommand() : (args[0]?.toLowerCase() || 'view');
    const guild = ctx.guild;

    if (sub === 'set') {
      const vanity = ctx.isSlash ? ctx.raw.options.getString('vanity') : args[1];
      const role = ctx.isSlash ? ctx.raw.options.getRole('role') : (guild.roles.cache.get(args[2]?.replace(/<@&|>/g, '')));

      if (!vanity || !role) return ctx.sendError('Invalid Usage', 'Usage: `?vanityrole set <vanity_string> <@role>`');

      ctx.client.db.prepare(`
        INSERT OR REPLACE INTO vanity_roles (guild_id, vanity_string, role_id, channel_id, log_enabled)
        VALUES (?, ?, ?, ?, 1)
      `).run(guild.id, vanity.toLowerCase(), role.id, ctx.channel.id);

      return ctx.sendSuccess('Vanity Role Configured', `Members who include \`${vanity}\` in their custom Discord status will now automatically receive **${role.name}** (<@&${role.id}>)!`);
    }

    if (sub === 'remove') {
      ctx.client.db.prepare('DELETE FROM vanity_roles WHERE guild_id = ?').run(guild.id);
      return ctx.sendSuccess('Vanity Role Removed', 'Vanity status role rewards disabled.');
    }

    if (sub === 'view') {
      const config = ctx.client.db.prepare('SELECT * FROM vanity_roles WHERE guild_id = ?').get(guild.id);
      if (!config) return ctx.reply({ embeds: [RotiEmbed.info('Vanity Role', 'No vanity status role configured.')] });

      const embed = new RotiEmbed()
        .setTitle(`✨ Vanity Status Role: ${guild.name}`)
        .setDescription(`**Required Status Text:** \`${config.vanity_string}\`\n**Awarded Role:** <@&${config.role_id}>\n**Log Channel:** <#${config.channel_id}>`)
        .setColor(botConfig.colors.teal);

      return ctx.reply({ embeds: [embed] });
    }
  }
}

module.exports = VanityRoleCommand;
