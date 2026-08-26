const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const Command = require('../Command.js');
const RotiEmbed = require('../../utils/embed.js');
const botConfig = require('../../config.js');

class MessageRolesCommand extends Command {
  constructor() {
    super({
      name: 'messageroles',
      description: 'Configure automatic role rewards for reaching message activity milestones',
      category: 'Tracking',
      usage: 'messageroles <add/remove/list> [messages] [role]',
      userPermissions: [PermissionFlagsBits.ManageGuild],
      slashData: new SlashCommandBuilder()
        .setName('messageroles')
        .setDescription('Configure role rewards for messages')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
        .addSubcommand(sub => sub.setName('add').setDescription('Add message role reward').addIntegerOption(opt => opt.setName('messages').setDescription('Messages required').setRequired(true)).addRoleOption(opt => opt.setName('role').setDescription('Role to award').setRequired(true)))
        .addSubcommand(sub => sub.setName('remove').setDescription('Remove message role reward').addIntegerOption(opt => opt.setName('messages').setDescription('Message count to remove').setRequired(true)))
        .addSubcommand(sub => sub.setName('list').setDescription('List all configured message role rewards'))
    });
  }

  async execute(ctx, args) {
    const sub = ctx.isSlash ? ctx.raw.options.getSubcommand() : (args[0]?.toLowerCase() || 'list');
    const guild = ctx.guild;

    if (sub === 'add') {
      const msgs = ctx.isSlash ? ctx.raw.options.getInteger('messages') : parseInt(args[1]);
      const role = ctx.isSlash ? ctx.raw.options.getRole('role') : (guild.roles.cache.get(args[2]?.replace(/<@&|>/g, '')));

      if (!msgs || !role) return ctx.sendError('Invalid Usage', 'Usage: `?messageroles add <message_count> <@role>`');

      ctx.client.db.prepare(`
        INSERT OR REPLACE INTO message_roles (guild_id, messages_needed, role_id)
        VALUES (?, ?, ?)
      `).run(guild.id, msgs, role.id);

      return ctx.sendSuccess('Message Role Added', `Members will now automatically receive **${role.name}** (<@&${role.id}>) upon reaching **${msgs.toLocaleString()}** messages!`);
    }

    if (sub === 'remove') {
      const msgs = ctx.isSlash ? ctx.raw.options.getInteger('messages') : parseInt(args[1]);
      if (!msgs) return ctx.sendError('Invalid Usage', 'Usage: `?messageroles remove <message_count>`');

      ctx.client.db.prepare('DELETE FROM message_roles WHERE guild_id = ? AND messages_needed = ?').run(guild.id, msgs);
      return ctx.sendSuccess('Message Role Removed', `Removed message reward for **${msgs.toLocaleString()}** messages.`);
    }

    if (sub === 'list') {
      const list = ctx.client.db.prepare('SELECT * FROM message_roles WHERE guild_id = ? ORDER BY messages_needed ASC').all(guild.id);
      if (list.length === 0) return ctx.reply({ embeds: [RotiEmbed.info('Message Roles', 'No message role rewards currently configured.')] });

      const formatted = list.map(r => `**${r.messages_needed.toLocaleString()} Messages:** <@&${r.role_id}>`).join('\n');
      const embed = new RotiEmbed()
        .setTitle(`🎁 Message Role Rewards: ${guild.name}`)
        .setDescription(formatted)
        .setColor(botConfig.colors.teal);

      return ctx.reply({ embeds: [embed] });
    }
  }
}

module.exports = MessageRolesCommand;
