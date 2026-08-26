const { SlashCommandBuilder, parseEmoji } = require('discord.js');
const Command = require('../Command.js');
const RotiEmbed = require('../../utils/embed.js');
const botConfig = require('../../config.js');

class EnlargeCommand extends Command {
  constructor() {
    super({
      name: 'enlarge',
      description: 'Enlarge a custom emoji and display its full resolution image',
      category: 'Fun',
      aliases: ['jumbo', 'bigemoji'],
      usage: 'enlarge <emoji>',
      slashData: new SlashCommandBuilder()
        .setName('enlarge')
        .setDescription('Enlarge a custom emoji')
        .addStringOption(opt => opt.setName('emoji').setDescription('Custom emoji to enlarge').setRequired(true))
    });
  }

  async execute(ctx, args) {
    const emojiStr = ctx.isSlash ? ctx.raw.options.getString('emoji') : args[0];
    if (!emojiStr) return ctx.sendError('Missing Emoji', 'Please provide a custom emoji to enlarge.');

    const parsed = parseEmoji(emojiStr);
    if (!parsed || !parsed.id) {
      return ctx.sendError('Invalid Emoji', 'Please provide a custom Discord emoji (default unicode emojis cannot be enlarged).');
    }

    const url = `https://cdn.discordapp.com/emojis/${parsed.id}.${parsed.animated ? 'gif' : 'png'}?size=512`;

    const embed = new RotiEmbed()
      .setTitle(`🔍 :${parsed.name}:`)
      .setImage(url)
      .setDescription(`[Direct Link](${url})`)
      .setColor(botConfig.colors.teal);

    return ctx.reply({ embeds: [embed] });
  }
}

module.exports = EnlargeCommand;
