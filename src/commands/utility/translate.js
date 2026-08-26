const { SlashCommandBuilder } = require('discord.js');
const Command = require('../Command.js');
const RotiEmbed = require('../../utils/embed.js');
const botConfig = require('../../config.js');

class TranslateCommand extends Command {
  constructor() {
    super({
      name: 'translate',
      description: 'Translate text between any languages',
      category: 'Utility',
      aliases: ['tr'],
      usage: 'translate <target_language> <text>',
      slashData: new SlashCommandBuilder()
        .setName('translate')
        .setDescription('Translate text')
        .addStringOption(opt => opt.setName('language').setDescription('Target language code (e.g. en, es, fr, de, ja)').setRequired(true))
        .addStringOption(opt => opt.setName('text').setDescription('Text to translate').setRequired(true))
    });
  }

  async execute(ctx, args) {
    const lang = ctx.isSlash ? ctx.raw.options.getString('language') : args[0]?.toLowerCase();
    const text = ctx.isSlash ? ctx.raw.options.getString('text') : args.slice(1).join(' ');

    if (!lang || !text) {
      return ctx.sendError('Missing Parameters', 'Usage: `?translate <lang_code> <text>` (e.g. `?translate es Hello, how are you?`)');
    }

    await ctx.defer();
    try {
      const res = await fetch(`https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=auto|${encodeURIComponent(lang)}`);
      const data = await res.json();
      const translation = data.responseData?.translatedText;

      if (!translation) {
        return ctx.sendError('Translation Failed', 'Could not translate text.');
      }

      const embed = new RotiEmbed()
        .setTitle('🌐 Translation')
        .addFields(
          { name: 'Original', value: `\`\`\`${text}\`\`\`` },
          { name: `Translated (${lang.toUpperCase()})`, value: `\`\`\`${translation}\`\`\`` }
        )
        .setColor(botConfig.colors.teal);

      return ctx.reply({ embeds: [embed] });
    } catch (e) {
      return ctx.sendError('API Error', 'Translation service error.');
    }
  }
}

module.exports = TranslateCommand;
