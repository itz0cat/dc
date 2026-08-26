const { SlashCommandBuilder } = require('discord.js');
const Command = require('../Command.js');
const RotiEmbed = require('../../utils/embed.js');
const botConfig = require('../../config.js');

class LyricsCommand extends Command {
  constructor() {
    super({
      name: 'lyrics',
      description: 'Search for and display song lyrics',
      category: 'Music',
      usage: 'lyrics [song title]',
      slashData: new SlashCommandBuilder()
        .setName('lyrics')
        .setDescription('Get song lyrics')
        .addStringOption(opt => opt.setName('song').setDescription('Song title'))
    });
  }

  async execute(ctx, args) {
    const queue = ctx.client.music.getQueue(ctx.guild.id);
    let title = ctx.isSlash ? ctx.raw.options.getString('song') : args.join(' ');
    
    if (!title && queue && queue.current) {
      title = queue.current.title;
    }

    if (!title) return ctx.sendError('Missing Song Title', 'Please specify a song title to search for lyrics.');

    await ctx.defer();
    try {
      const res = await fetch(`https://some-random-api.com/lyrics?title=${encodeURIComponent(title)}`);
      const data = await res.json();

      if (!data || !data.lyrics) {
        return ctx.sendError('Lyrics Not Found', `Could not find lyrics for \`${title}\`.`);
      }

      const lyricsText = data.lyrics.slice(0, 4000);
      const embed = new RotiEmbed()
        .setTitle(`📜 Lyrics: ${data.title} - ${data.author}`)
        .setDescription(lyricsText)
        .setThumbnail(data.thumbnail?.genius)
        .setColor(botConfig.colors.teal);

      return ctx.reply({ embeds: [embed] });
    } catch (e) {
      return ctx.sendError('Error', 'Unable to retrieve lyrics at this time.');
    }
  }
}

module.exports = LyricsCommand;
