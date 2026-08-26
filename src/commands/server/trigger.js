const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const Command = require('../Command.js');
const RotiEmbed = require('../../utils/embed.js');
const botConfig = require('../../config.js');

class TriggerCommand extends Command {
  constructor() {
    super({
      name: 'trigger',
      description: 'Manage auto-responder triggers for the server',
      category: 'Server',
      aliases: ['triggers'],
      usage: 'trigger <create/delete/list/info> [name] [response] [wildcard]',
      userPermissions: [PermissionFlagsBits.ManageGuild],
      slashData: new SlashCommandBuilder()
        .setName('trigger')
        .setDescription('Auto-responder triggers')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
        .addSubcommand(sub => sub.setName('create').setDescription('Create a trigger').addStringOption(opt => opt.setName('name').setDescription('Trigger keyword/phrase').setRequired(true)).addStringOption(opt => opt.setName('response').setDescription('Bot response').setRequired(true)).addBooleanOption(opt => opt.setName('wildcard').setDescription('Trigger anywhere in message (default: true)')))
        .addSubcommand(sub => sub.setName('delete').setDescription('Delete a trigger').addStringOption(opt => opt.setName('name').setDescription('Trigger keyword').setRequired(true)))
        .addSubcommand(sub => sub.setName('list').setDescription('List all triggers'))
    });
  }

  async execute(ctx, args) {
    const sub = ctx.isSlash ? ctx.raw.options.getSubcommand() : (args[0]?.toLowerCase() || 'list');
    const guild = ctx.guild;

    if (sub === 'create') {
      const name = ctx.isSlash ? ctx.raw.options.getString('name') : args[1];
      const response = ctx.isSlash ? ctx.raw.options.getString('response') : args.slice(2).join(' ');
      const wildcard = ctx.isSlash ? (ctx.raw.options.getBoolean('wildcard') ?? true) : true;

      if (!name || !response) return ctx.sendError('Missing Parameters', 'Usage: `trigger create <keyword> <response>`');

      ctx.client.db.prepare(`
        INSERT OR REPLACE INTO triggers (guild_id, name, response, wildcard, created_by)
        VALUES (?, ?, ?, ?, ?)
      `).run(guild.id, name.toLowerCase(), response, wildcard ? 1 : 0, ctx.user.id);

      return ctx.sendSuccess('Trigger Created', `Trigger for \`${name.toLowerCase()}\` is now active!`);
    }

    if (sub === 'delete') {
      const name = ctx.isSlash ? ctx.raw.options.getString('name') : args[1];
      if (!name) return ctx.sendError('Missing Keyword', 'Please specify a trigger keyword to delete.');

      ctx.client.db.prepare('DELETE FROM triggers WHERE guild_id = ? AND LOWER(name) = ?').run(guild.id, name.toLowerCase());
      return ctx.sendSuccess('Trigger Deleted', `Trigger \`${name.toLowerCase()}\` has been removed.`);
    }

    if (sub === 'list') {
      const triggers = ctx.client.db.prepare('SELECT name FROM triggers WHERE guild_id = ?').pluck().all(guild.id);
      const list = triggers.length > 0 ? triggers.map(t => `\`${t}\``).join(', ') : '*No triggers configured.*';

      const embed = new RotiEmbed()
        .setTitle('⚡ Auto-Responder Triggers')
        .setDescription(list)
        .setColor(botConfig.colors.teal);
      return ctx.reply({ embeds: [embed] });
    }
  }
}

module.exports = TriggerCommand;
