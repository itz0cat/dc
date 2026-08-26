const { SlashCommandBuilder } = require('discord.js');
const Command = require('../Command.js');
const RotiEmbed = require('../../utils/embed.js');
const botConfig = require('../../config.js');

class DictionaryCommand extends Command {
  constructor() {
    super({
      name: 'dictionary',
      description: 'Look up real English dictionary definitions, parts of speech, and pronunciations',
      category: 'Utility',
      aliases: ['dict', 'define', 'meaning'],
      usage: 'dictionary <word>',
      slashData: new SlashCommandBuilder()
        .setName('dictionary')
        .setDescription('Look up English dictionary definition')
        .addStringOption(opt => opt.setName('word').setDescription('Word to define').setRequired(true))
    });
  }

  async execute(ctx, args) {
    const word = ctx.isSlash ? ctx.raw.options.getString('word') : args[0];
    if (!word) return ctx.sendError('Missing Word', 'Please specify an English word to define.');

    await ctx.defer();
    try {
      const res = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word)}`);
      if (!res.ok) return ctx.sendError('Not Found', `No definitions found for \`${word}\`.`);

      const data = await res.json();
      const item = data[0];
      const phonetic = item.phonetic || item.phonetics?.find(p => p.text)?.text || '';
      
      const meanings = item.meanings.slice(0, 3).map(m => {
        const def = m.definitions[0]?.definition || '';
        const example = m.definitions[0]?.example ? `\n> *Example: "${m.definitions[0].example}"*` : '';
        return `**${m.partOfSpeech.toUpperCase()}**\n• ${def}${example}`;
      }).join('\n\n');

      const embed = new RotiEmbed()
        .setTitle(`📖 Dictionary: ${item.word} ${phonetic ? `(\`${phonetic}\`)` : ''}`)
        .setDescription(meanings.slice(0, 2048))
        .setColor(botConfig.colors.teal);

      return ctx.reply({ embeds: [embed] });
    } catch (e) {
      return ctx.sendError('Error', 'Unable to fetch dictionary definition.');
    }
  }
}

module.exports = DictionaryCommand;
