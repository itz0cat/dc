const { SlashCommandBuilder } = require('discord.js');
const Command = require('../Command.js');
const RotiEmbed = require('../../utils/embed.js');
const botConfig = require('../../config.js');

class MemeCommand extends Command {
  constructor() {
    super({
      name: 'meme',
      description: 'Fetch and display a random meme from Reddit',
      category: 'Fun',
      aliases: ['memes'],
      usage: 'meme',
      slashData: new SlashCommandBuilder()
        .setName('meme')
        .setDescription('Get a random meme')
    });
  }

  async execute(ctx) {
    await ctx.defer();
    try {
      const response = await fetch('https://meme-api.com/gimme/memes');
      const data = await response.json();

      if (!data || !data.url) {
        return ctx.sendError('Error', 'Could not fetch a meme at this moment. Please try again!');
      }

      const embed = new RotiEmbed()
        .setTitle(data.title || 'Random Meme')
        .setImage(data.url)
        .setFooter({ text: `👍 ${data.ups || 0} upvotes • r/${data.subreddit} • ${botConfig.footerText}` })
        .setColor(botConfig.colors.teal);

      return ctx.reply({ embeds: [embed] });
    } catch (err) {
      return ctx.sendError('Fetch Failed', 'Unable to retrieve meme from Reddit.');
    }
  }
}

module.exports = MemeCommand;
