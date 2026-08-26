const { SlashCommandBuilder } = require('discord.js');
const Command = require('../Command.js');

class AsciiCommand extends Command {
  constructor() {
    super({
      name: 'ascii',
      description: 'Convert text into banner ASCII font text',
      category: 'Fun',
      usage: 'ascii <text>',
      slashData: new SlashCommandBuilder()
        .setName('ascii')
        .setDescription('Convert text to ASCII art')
        .addStringOption(opt => opt.setName('text').setDescription('Text to convert').setRequired(true))
    });
  }

  async execute(ctx, args) {
    const text = ctx.isSlash ? ctx.raw.options.getString('text') : args.join(' ');
    if (!text) return ctx.sendError('Missing Text', 'Please provide text.');

    if (text.length > 20) {
      return ctx.sendError('Too Long', 'Please provide 20 characters or fewer.');
    }

    try {
      const res = await fetch(`https://artii.herokuapp.com/make?text=${encodeURIComponent(text)}`);
      const asciiArt = await res.text();

      if (!asciiArt || asciiArt.length > 1900) {
        return ctx.sendError('Error', 'Generated ASCII art was too large for Discord.');
      }

      return ctx.reply({ content: `\`\`\`\n${asciiArt}\n\`\`\`` });
    } catch (e) {
      return ctx.sendError('Error', 'Unable to generate ASCII art.');
    }
  }
}

module.exports = AsciiCommand;
