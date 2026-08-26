const { SlashCommandBuilder } = require('discord.js');
const Command = require('../Command.js');
const RotiEmbed = require('../../utils/embed.js');
const botConfig = require('../../config.js');
const { formatDuration } = require('../../utils/time.js');

class SnipeCommand extends Command {
  constructor() {
    super({
      name: 'snipe',
      description: 'Shows the most recently deleted message in this channel',
      category: 'Fun',
      usage: 'snipe',
      slashData: new SlashCommandBuilder()
        .setName('snipe')
        .setDescription('Snipe the last deleted message')
    });
  }

  async execute(ctx) {
    const snipe = ctx.client.snipes.get(ctx.channel.id);
    if (!snipe) {
      return ctx.sendError('Nothing to Snipe', 'There are no recently deleted messages in this channel.');
    }

    const timeAgo = formatDuration(Date.now() - snipe.timestamp);

    const embed = new RotiEmbed()
      .setAuthor({ name: snipe.author?.tag || 'Unknown', iconURL: snipe.author?.displayAvatarURL() })
      .setDescription(snipe.content || '*[No content]*')
      .setFooter({ text: `Deleted ${timeAgo} ago • ${botConfig.footerText}` })
      .setColor(botConfig.colors.teal);

    if (snipe.image) {
      embed.setImage(snipe.image);
    }

    return ctx.reply({ embeds: [embed] });
  }
}

module.exports = SnipeCommand;
