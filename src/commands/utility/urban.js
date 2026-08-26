const { SlashCommandBuilder } = require('discord.js');
const Command = require('../Command.js');
const RotiEmbed = require('../../utils/embed.js');
const botConfig = require('../../config.js');

class UrbanCommand extends Command {
  constructor() {
    super({
      name: 'urban',
      description: 'Defines a slang word or phrase from Urban Dictionary',
      category: 'Utility',
      aliases: ['dictionary', 'define'],
      usage: 'urban <query>',
      slashData: new SlashCommandBuilder()
        .setName('urban')
        .setDescription('Defines a word via Urban Dictionary')
        .addStringOption(opt => opt.setName('query').setDescription('Word or phrase to define').setRequired(true))
    });
  }

  async execute(ctx, args) {
    const query = ctx.isSlash ? ctx.raw.options.getString('query') : args.join(' ');
    if (!query) return ctx.sendError('Missing Query', 'Please provide a term to define.');

    await ctx.defer();
    try {
      const res = await fetch(`https://api.urbandictionary.com/v0/define?term=${encodeURIComponent(query)}`);
      const data = await res.json();

      if (!data.list || data.list.length === 0) {
        return ctx.sendError('Not Found', `No definitions found for \`${query}\`.`);
      }

      const item = data.list[0];
      const definition = item.definition.replace(/\[|\]/g, '').slice(0, 1024);
      const example = item.example ? item.example.replace(/\[|\]/g, '').slice(0, 1024) : '*No example*';

      const embed = new RotiEmbed()
        .setTitle(`📚 Urban Dictionary: ${item.word}`)
        .setURL(item.permalink)
        .addFields(
          { name: 'Definition', value: definition },
          { name: 'Example', value: `*${example}*` },
          { name: 'Rating', value: `👍 ${item.thumbs_up} | 👎 ${item.thumbs_down}` }
        )
        .setColor(botConfig.colors.teal);

      return ctx.reply({ embeds: [embed] });
    } catch (err) {
      return ctx.sendError('API Error', 'Failed to fetch definition from Urban Dictionary.');
    }
  }
}

module.exports = UrbanCommand;
