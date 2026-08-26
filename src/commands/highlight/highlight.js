const { SlashCommandBuilder, ChannelType } = require('discord.js');
const Command = require('../Command.js');
const RotiEmbed = require('../../utils/embed.js');
const botConfig = require('../../config.js');

class HighlightCommand extends Command {
  constructor() {
    super({
      name: 'highlight',
      description: 'Get direct message alerts whenever specified words or keywords are mentioned',
      category: 'Highlight',
      aliases: ['hl'],
      usage: 'highlight <add/remove/list/removeall/ignorechannel/ignoreuser> [keyword]',
      slashData: new SlashCommandBuilder()
        .setName('highlight')
        .setDescription('Manage keyword mention alerts')
        .addSubcommand(sub => sub.setName('add').setDescription('Add a keyword to highlight').addStringOption(opt => opt.setName('word').setDescription('Word or phrase to track').setRequired(true)))
        .addSubcommand(sub => sub.setName('remove').setDescription('Remove a tracked keyword').addStringOption(opt => opt.setName('word').setDescription('Word to remove').setRequired(true)))
        .addSubcommand(sub => sub.setName('list').setDescription('List your tracked highlight keywords'))
        .addSubcommand(sub => sub.setName('removeall').setDescription('Remove all your tracked keywords'))
        .addSubcommand(sub => sub.setName('ignorechannel').setDescription('Ignore a channel from highlight triggers').addChannelOption(opt => opt.setName('channel').setDescription('Channel to ignore').addChannelTypes(ChannelType.GuildText).setRequired(true)))
        .addSubcommand(sub => sub.setName('ignoreuser').setDescription('Ignore a user from highlight triggers').addUserOption(opt => opt.setName('user').setDescription('User to ignore').setRequired(true)))
    });
  }

  async execute(ctx, args) {
    const sub = ctx.isSlash ? ctx.raw.options.getSubcommand() : (args[0]?.toLowerCase() || 'list');
    const guild = ctx.guild;

    if (sub === 'add') {
      const word = ctx.isSlash ? ctx.raw.options.getString('word') : args.slice(1).join(' ');
      if (!word) return ctx.sendError('Missing Keyword', 'Please specify a keyword to highlight.');

      ctx.client.db.prepare(`
        INSERT INTO highlights (guild_id, user_id, word)
        VALUES (?, ?, ?)
      `).run(guild.id, ctx.user.id, word.toLowerCase());

      return ctx.sendSuccess('Highlight Added', `I will now send you a DM whenever \`${word}\` is mentioned in this server!`);
    }

    if (sub === 'remove') {
      const word = ctx.isSlash ? ctx.raw.options.getString('word') : args.slice(1).join(' ');
      if (!word) return ctx.sendError('Missing Keyword', 'Please specify a keyword to remove.');

      ctx.client.db.prepare('DELETE FROM highlights WHERE guild_id = ? AND user_id = ? AND LOWER(word) = ?').run(guild.id, ctx.user.id, word.toLowerCase());
      return ctx.sendSuccess('Highlight Removed', `Removed \`${word}\` from your highlight alerts.`);
    }

    if (sub === 'removeall') {
      ctx.client.db.prepare('DELETE FROM highlights WHERE guild_id = ? AND user_id = ?').run(guild.id, ctx.user.id);
      return ctx.sendSuccess('Highlights Cleared', 'All your highlight alerts for this server have been removed.');
    }

    if (sub === 'list') {
      const userHighlights = ctx.client.db.prepare('SELECT word FROM highlights WHERE guild_id = ? AND user_id = ?').pluck().all(guild.id, ctx.user.id);
      const list = userHighlights.length > 0 ? userHighlights.map(w => `\`${w}\``).join(', ') : '*You have no active highlight keywords.*';

      const embed = new RotiEmbed()
        .setTitle(`🔔 Your Highlights (${userHighlights.length})`)
        .setDescription(list)
        .setColor(botConfig.colors.teal);
      return ctx.reply({ embeds: [embed], ephemeral: true });
    }
  }
}

module.exports = HighlightCommand;
