const { SlashCommandBuilder } = require('discord.js');
const Command = require('../Command.js');
const RotiEmbed = require('../../utils/embed.js');
const botConfig = require('../../config.js');

class WikipediaCommand extends Command {
  constructor() {
    super({
      name: 'wikipedia',
      description: 'Search Wikipedia and get an instant summary of any topic or article',
      category: 'Utility',
      aliases: ['wiki', 'encyclopedia'],
      usage: 'wikipedia <search query>',
      slashData: new SlashCommandBuilder()
        .setName('wikipedia')
        .setDescription('Search Wikipedia articles')
        .addStringOption(opt => opt.setName('query').setDescription('Topic to search for').setRequired(true))
    });
  }

  async execute(ctx, args) {
    const query = ctx.isSlash ? ctx.raw.options.getString('query') : args.join(' ');
    if (!query) return ctx.sendError('Missing Query', 'Please provide a topic to search on Wikipedia.');

    await ctx.defer();
    try {
      const res = await fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(query)}`);
      if (!res.ok) return ctx.sendError('Not Found', `No Wikipedia articles found for \`${query}\`.`);

      const data = await res.json();
      if (!data.extract) return ctx.sendError('Not Found', `No summary found for \`${query}\`.`);

      const embed = new RotiEmbed()
        .setTitle(`📚 Wikipedia: ${data.title}`)
        .setURL(data.content_urls?.desktop?.page || `https://en.wikipedia.org/wiki/${encodeURIComponent(query)}`)
        .setDescription(data.extract.slice(0, 2048))
        .setThumbnail(data.thumbnail?.source)
        .setColor(botConfig.colors.teal);

      return ctx.reply({ embeds: [embed] });
    } catch (e) {
      return ctx.sendError('API Error', 'Failed to retrieve Wikipedia article.');
    }
  }
}

module.exports = WikipediaCommand;
