const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const Command = require('../Command.js');
const RotiEmbed = require('../../utils/embed.js');
const botConfig = require('../../config.js');

class BanwordCommand extends Command {
  constructor() {
    super({
      name: 'banword',
      description: 'Add, remove, or list banned words automatically filtered by R.O.T.I',
      category: 'Automod',
      aliases: ['filterword', 'bannedwords'],
      usage: 'banword <add/remove/list/clear> [word]',
      userPermissions: [PermissionFlagsBits.ManageGuild],
      slashData: new SlashCommandBuilder()
        .setName('banword')
        .setDescription('Manage blacklisted words')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
        .addSubcommand(sub => sub.setName('add').setDescription('Add a banned word').addStringOption(opt => opt.setName('word').setDescription('Word to ban').setRequired(true)))
        .addSubcommand(sub => sub.setName('remove').setDescription('Remove a banned word').addStringOption(opt => opt.setName('word').setDescription('Word to unban').setRequired(true)))
        .addSubcommand(sub => sub.setName('list').setDescription('List all banned words'))
        .addSubcommand(sub => sub.setName('clear').setDescription('Clear all banned words'))
    });
  }

  async execute(ctx, args) {
    const sub = ctx.isSlash ? ctx.raw.options.getSubcommand() : (args[0]?.toLowerCase() || 'list');
    const guild = ctx.guild;

    if (sub === 'add') {
      const word = ctx.isSlash ? ctx.raw.options.getString('word') : args[1];
      if (!word) return ctx.sendError('Missing Word', 'Please specify a word to blacklist.');

      ctx.client.db.prepare('INSERT OR IGNORE INTO banwords (guild_id, word) VALUES (?, ?)').run(guild.id, word.toLowerCase());
      return ctx.sendSuccess('Word Blacklisted', `Word \`${word.toLowerCase()}\` has been added to the AutoMod filter.`);
    }

    if (sub === 'remove') {
      const word = ctx.isSlash ? ctx.raw.options.getString('word') : args[1];
      if (!word) return ctx.sendError('Missing Word', 'Please specify a word to remove.');

      ctx.client.db.prepare('DELETE FROM banwords WHERE guild_id = ? AND word = ?').run(guild.id, word.toLowerCase());
      return ctx.sendSuccess('Word Removed', `Word \`${word.toLowerCase()}\` has been removed from the blacklist.`);
    }

    if (sub === 'clear') {
      ctx.client.db.prepare('DELETE FROM banwords WHERE guild_id = ?').run(guild.id);
      return ctx.sendSuccess('Blacklist Cleared', 'All banned words have been wiped for this server.');
    }

    if (sub === 'list') {
      const words = ctx.client.db.prepare('SELECT word FROM banwords WHERE guild_id = ?').pluck().all(guild.id);
      const list = words.length > 0 ? words.map(w => `\`${w}\``).join(', ') : '*No words currently blacklisted.*';

      const embed = new RotiEmbed()
        .setTitle('🚫 Blacklisted Words Filter')
        .setDescription(list)
        .setColor(botConfig.colors.teal);
      return ctx.reply({ embeds: [embed], ephemeral: true });
    }
  }
}

module.exports = BanwordCommand;
