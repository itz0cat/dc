const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const Command = require('../Command.js');
const RotiEmbed = require('../../utils/embed.js');
const botConfig = require('../../config.js');

class NoteCommand extends Command {
  constructor() {
    super({
      name: 'note',
      description: 'Manage moderator notes on users (set, get, list, remove, clear)',
      category: 'Moderation',
      aliases: ['notes'],
      usage: 'note <set/get/list/remove/clear> [user] [note/id]',
      userPermissions: [PermissionFlagsBits.ManageMessages],
      slashData: new SlashCommandBuilder()
        .setName('note')
        .setDescription('Manage moderator notes')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
        .addSubcommand(sub => sub.setName('set').setDescription('Set note for a user').addUserOption(opt => opt.setName('user').setDescription('User').setRequired(true)).addStringOption(opt => opt.setName('note').setDescription('Note text').setRequired(true)))
        .addSubcommand(sub => sub.setName('get').setDescription('Get notes for a user').addUserOption(opt => opt.setName('user').setDescription('User').setRequired(true)))
        .addSubcommand(sub => sub.setName('remove').setDescription('Remove a specific note').addIntegerOption(opt => opt.setName('id').setDescription('Note ID').setRequired(true)))
        .addSubcommand(sub => sub.setName('clear').setDescription('Clear all notes for a user').addUserOption(opt => opt.setName('user').setDescription('User').setRequired(true)))
    });
  }

  async execute(ctx, args) {
    const sub = ctx.isSlash ? ctx.raw.options.getSubcommand() : (args[0]?.toLowerCase() || 'get');
    const guild = ctx.guild;

    if (sub === 'set') {
      const user = ctx.isSlash ? ctx.raw.options.getUser('user') : ctx.raw.mentions.users.first();
      const noteText = ctx.isSlash ? ctx.raw.options.getString('note') : args.slice(2).join(' ');
      if (!user || !noteText) return ctx.sendError('Missing Parameters', 'Usage: `note set <user> <note>`');

      ctx.client.db.prepare(`
        INSERT INTO notes (guild_id, user_id, mod_id, note, created_at)
        VALUES (?, ?, ?, ?, ?)
      `).run(guild.id, user.id, ctx.user.id, noteText, Date.now());

      return ctx.sendSuccess('Note Added', `Added note to <@${user.id}>:\n*"${noteText}"*`);
    }

    if (sub === 'get' || sub === 'list') {
      const user = ctx.isSlash ? ctx.raw.options.getUser('user') : (ctx.raw.mentions.users.first() || ctx.user);
      const notes = ctx.client.db.prepare('SELECT * FROM notes WHERE guild_id = ? AND user_id = ?').all(guild.id, user.id);

      if (notes.length === 0) {
        return ctx.reply({ embeds: [RotiEmbed.info('No Notes', `<@${user.id}> has no moderator notes.`)] });
      }

      const list = notes.map(n => `**#${n.id}** • <t:${Math.floor(n.created_at / 1000)}:d> by <@${n.mod_id}>\n*"${n.note}"*`).join('\n\n');
      const embed = new RotiEmbed()
        .setTitle(`📝 Notes for ${user.tag} (${notes.length})`)
        .setDescription(list)
        .setColor(botConfig.colors.teal);
      return ctx.reply({ embeds: [embed] });
    }

    if (sub === 'remove') {
      const noteId = ctx.isSlash ? ctx.raw.options.getInteger('id') : parseInt(args[1]);
      if (!noteId) return ctx.sendError('Missing Note ID', 'Please specify a note ID to remove.');

      ctx.client.db.prepare('DELETE FROM notes WHERE guild_id = ? AND id = ?').run(guild.id, noteId);
      return ctx.sendSuccess('Note Removed', `Note #${noteId} has been deleted.`);
    }

    if (sub === 'clear') {
      const user = ctx.isSlash ? ctx.raw.options.getUser('user') : ctx.raw.mentions.users.first();
      if (!user) return ctx.sendError('Missing User', 'Please specify a user to clear notes for.');

      ctx.client.db.prepare('DELETE FROM notes WHERE guild_id = ? AND user_id = ?').run(guild.id, user.id);
      return ctx.sendSuccess('Notes Cleared', `All notes for <@${user.id}> have been cleared.`);
    }
  }
}

module.exports = NoteCommand;
