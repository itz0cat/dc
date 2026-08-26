const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const Command = require('../Command.js');
const RotiEmbed = require('../../utils/embed.js');
const botConfig = require('../../config.js');

class TagCommand extends Command {
  constructor() {
    super({
      name: 'tag',
      description: 'Create, delete, list, and view custom server tags',
      category: 'Server',
      aliases: ['tags'],
      usage: 'tag <create/delete/list/info/get> [name] [content]',
      slashData: new SlashCommandBuilder()
        .setName('tag')
        .setDescription('Custom server tags')
        .addSubcommand(sub => sub.setName('get').setDescription('Display a tag').addStringOption(opt => opt.setName('name').setDescription('Tag name').setRequired(true)))
        .addSubcommand(sub => sub.setName('create').setDescription('Create or edit a tag').addStringOption(opt => opt.setName('name').setDescription('Tag name').setRequired(true)).addStringOption(opt => opt.setName('content').setDescription('Tag content').setRequired(true)).addBooleanOption(opt => opt.setName('embed').setDescription('Display as an embed')))
        .addSubcommand(sub => sub.setName('delete').setDescription('Delete a tag').addStringOption(opt => opt.setName('name').setDescription('Tag name').setRequired(true)))
        .addSubcommand(sub => sub.setName('list').setDescription('List all server tags'))
        .addSubcommand(sub => sub.setName('info').setDescription('View information about a tag').addStringOption(opt => opt.setName('name').setDescription('Tag name').setRequired(true)))
    });
  }

  async execute(ctx, args) {
    const isDirectGet = args[0] && !['create', 'delete', 'list', 'info', 'get'].includes(args[0].toLowerCase());
    const sub = ctx.isSlash ? ctx.raw.options.getSubcommand() : (isDirectGet ? 'get' : (args[0]?.toLowerCase() || 'list'));
    const guild = ctx.guild;

    if (sub === 'get') {
      const name = ctx.isSlash ? ctx.raw.options.getString('name') : (isDirectGet ? args[0] : args[1]);
      if (!name) return ctx.sendError('Missing Name', 'Please specify a tag name.');

      const tag = ctx.client.db.prepare('SELECT * FROM tags WHERE guild_id = ? AND LOWER(name) = ?').get(guild.id, name.toLowerCase());
      if (!tag) return ctx.sendError('Not Found', `Tag \`${name}\` does not exist.`);

      if (tag.embed) {
        return ctx.reply({ embeds: [new RotiEmbed().setTitle(tag.name).setDescription(tag.content).setColor(botConfig.colors.teal)] });
      }
      return ctx.reply({ content: tag.content });
    }

    if (sub === 'create') {
      if (!ctx.member.permissions.has(PermissionFlagsBits.ManageMessages)) {
        return ctx.sendError('Permission Denied', 'You need Manage Messages to create tags.');
      }
      const name = ctx.isSlash ? ctx.raw.options.getString('name') : args[1];
      const content = ctx.isSlash ? ctx.raw.options.getString('content') : args.slice(2).join(' ');
      const isEmbed = ctx.isSlash ? (ctx.raw.options.getBoolean('embed') ? 1 : 0) : 0;

      if (!name || !content) return ctx.sendError('Missing Arguments', 'Usage: `tag create <name> <content>`');

      ctx.client.db.prepare(`
        INSERT OR REPLACE INTO tags (guild_id, name, content, embed, created_by, created_at)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(guild.id, name.toLowerCase(), content, isEmbed, ctx.user.id, Date.now());

      return ctx.sendSuccess('Tag Created', `Tag \`${name.toLowerCase()}\` has been saved successfully!`);
    }

    if (sub === 'delete') {
      if (!ctx.member.permissions.has(PermissionFlagsBits.ManageMessages)) {
        return ctx.sendError('Permission Denied', 'You need Manage Messages to delete tags.');
      }
      const name = ctx.isSlash ? ctx.raw.options.getString('name') : args[1];
      if (!name) return ctx.sendError('Missing Name', 'Please specify a tag name to delete.');

      ctx.client.db.prepare('DELETE FROM tags WHERE guild_id = ? AND LOWER(name) = ?').run(guild.id, name.toLowerCase());
      return ctx.sendSuccess('Tag Deleted', `Tag \`${name.toLowerCase()}\` has been removed.`);
    }

    if (sub === 'list') {
      const tags = ctx.client.db.prepare('SELECT name FROM tags WHERE guild_id = ?').pluck().all(guild.id);
      const list = tags.length > 0 ? tags.map(t => `\`${t}\``).join(', ') : '*No tags created yet.*';

      const embed = new RotiEmbed()
        .setTitle('🏷️ Server Tags')
        .setDescription(list)
        .setColor(botConfig.colors.teal);
      return ctx.reply({ embeds: [embed] });
    }

    if (sub === 'info') {
      const name = ctx.isSlash ? ctx.raw.options.getString('name') : args[1];
      const tag = ctx.client.db.prepare('SELECT * FROM tags WHERE guild_id = ? AND LOWER(name) = ?').get(guild.id, name?.toLowerCase());
      if (!tag) return ctx.sendError('Not Found', `Tag \`${name}\` not found.`);

      const embed = new RotiEmbed()
        .setTitle(`🏷️ Tag Info: ${tag.name}`)
        .addFields(
          { name: 'Created by', value: `<@${tag.created_by}>`, inline: true },
          { name: 'Embed Format', value: tag.embed ? 'Yes' : 'No', inline: true },
          { name: 'Created At', value: `<t:${Math.floor(tag.created_at / 1000)}:R>`, inline: true }
        )
        .setColor(botConfig.colors.teal);
      return ctx.reply({ embeds: [embed] });
    }
  }
}

module.exports = TagCommand;
