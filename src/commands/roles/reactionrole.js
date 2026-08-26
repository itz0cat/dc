const { SlashCommandBuilder, PermissionFlagsBits, parseEmoji } = require('discord.js');
const Command = require('../Command.js');
const RotiEmbed = require('../../utils/embed.js');
const botConfig = require('../../config.js');

class ReactionroleCommand extends Command {
  constructor() {
    super({
      name: 'reactionrole',
      description: 'Manage reaction roles on messages',
      category: 'Roles',
      aliases: ['rr'],
      usage: 'reactionrole <add/remove/removeall> [message_id] [emoji] [role]',
      userPermissions: [PermissionFlagsBits.ManageRoles],
      botPermissions: [PermissionFlagsBits.ManageRoles, PermissionFlagsBits.AddReactions],
      slashData: new SlashCommandBuilder()
        .setName('reactionrole')
        .setDescription('Manage reaction roles')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles)
        .addSubcommand(sub => sub.setName('add').setDescription('Add reaction role').addStringOption(opt => opt.setName('message_id').setDescription('Message ID').setRequired(true)).addStringOption(opt => opt.setName('emoji').setDescription('Emoji to react with').setRequired(true)).addRoleOption(opt => opt.setName('role').setDescription('Role to assign').setRequired(true)))
        .addSubcommand(sub => sub.setName('remove').setDescription('Remove a reaction role').addStringOption(opt => opt.setName('message_id').setDescription('Message ID').setRequired(true)).addStringOption(opt => opt.setName('emoji').setDescription('Emoji').setRequired(true)))
        .addSubcommand(sub => sub.setName('removeall').setDescription('Remove all reaction roles for a message').addStringOption(opt => opt.setName('message_id').setDescription('Message ID').setRequired(true)))
    });
  }

  async execute(ctx, args) {
    const sub = ctx.isSlash ? ctx.raw.options.getSubcommand() : (args[0]?.toLowerCase() || 'add');
    const guild = ctx.guild;

    if (sub === 'add') {
      const msgId = ctx.isSlash ? ctx.raw.options.getString('message_id') : args[1];
      const emoji = ctx.isSlash ? ctx.raw.options.getString('emoji') : args[2];
      const role = ctx.isSlash ? ctx.raw.options.getRole('role') : (guild.roles.cache.get(args[3]?.replace(/<@&|>/g, '')));

      if (!msgId || !emoji || !role) return ctx.sendError('Missing Parameters', 'Usage: `reactionrole add <message_id> <emoji> <role>`');

      const targetMsg = await ctx.channel.messages.fetch(msgId).catch(() => null);
      if (!targetMsg) return ctx.sendError('Message Not Found', 'Message was not found in this channel.');

      await targetMsg.react(emoji).catch(err => {
        return ctx.sendError('Failed to React', `Could not add reaction emoji: ${err.message}`);
      });

      ctx.client.db.prepare(`
        INSERT INTO button_roles (guild_id, channel_id, message_id, role_id, emoji, type)
        VALUES (?, ?, ?, ?, ?, "reaction")
      `).run(guild.id, ctx.channel.id, msgId, role.id, emoji);

      return ctx.sendSuccess('Reaction Role Added', `Reacting with ${emoji} on message \`${msgId}\` will now grant the **${role.name}** role!`);
    }

    if (sub === 'remove') {
      const msgId = ctx.isSlash ? ctx.raw.options.getString('message_id') : args[1];
      const emoji = ctx.isSlash ? ctx.raw.options.getString('emoji') : args[2];

      ctx.client.db.prepare('DELETE FROM button_roles WHERE guild_id = ? AND message_id = ? AND emoji = ?').run(guild.id, msgId, emoji);
      return ctx.sendSuccess('Reaction Role Removed', `Reaction role for ${emoji} on message \`${msgId}\` has been removed.`);
    }

    if (sub === 'removeall') {
      const msgId = ctx.isSlash ? ctx.raw.options.getString('message_id') : args[1];
      ctx.client.db.prepare('DELETE FROM button_roles WHERE guild_id = ? AND message_id = ?').run(guild.id, msgId);
      return ctx.sendSuccess('Reaction Roles Cleared', `All reaction roles removed for message \`${msgId}\`.`);
    }
  }
}

module.exports = ReactionroleCommand;
