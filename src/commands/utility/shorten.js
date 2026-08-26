const { SlashCommandBuilder } = require('discord.js');
const Command = require('../Command.js');
const RotiEmbed = require('../../utils/embed.js');
const botConfig = require('../../config.js');

class ShortenCommand extends Command {
  constructor() {
    super({
      name: 'shorten',
      description: 'Shorten any long URL into a clean compact link',
      category: 'Utility',
      aliases: ['shorturl', 'tinyurl'],
      usage: 'shorten <url>',
      slashData: new SlashCommandBuilder()
        .setName('shorten')
        .setDescription('Shorten a URL')
        .addStringOption(opt => opt.setName('url').setDescription('URL to shorten').setRequired(true))
    });
  }

  async execute(ctx, args) {
    const url = ctx.isSlash ? ctx.raw.options.getString('url') : args[0];
    if (!url) return ctx.sendError('Missing URL', 'Please provide a valid URL to shorten.');

    await ctx.defer();
    try {
      const res = await fetch(`https://tinyurl.com/api-create.php?url=${encodeURIComponent(url)}`);
      const shortUrl = await res.text();

      const embed = new RotiEmbed()
        .setTitle('🔗 Shortened URL')
        .addFields(
          { name: 'Original', value: `\`${url.slice(0, 100)}\`` },
          { name: 'Short Link', value: `[${shortUrl}](${shortUrl})` }
        )
        .setColor(botConfig.colors.teal);

      return ctx.reply({ embeds: [embed] });
    } catch (e) {
      return ctx.sendError('Error', 'Unable to shorten URL.');
    }
  }
}

module.exports = ShortenCommand;
