const { SlashCommandBuilder } = require('discord.js');
const Command = require('../Command.js');

class EmojifyCommand extends Command {
  constructor() {
    super({
      name: 'emojify',
      description: 'Converts your text into regional indicator letter emojis',
      category: 'Fun',
      usage: 'emojify <text>',
      slashData: new SlashCommandBuilder()
        .setName('emojify')
        .setDescription('Convert text into letter emojis')
        .addStringOption(opt => opt.setName('text').setDescription('Text to convert').setRequired(true))
    });
  }

  async execute(ctx, args) {
    const text = ctx.isSlash ? ctx.raw.options.getString('text') : args.join(' ');
    if (!text) return ctx.sendError('Missing Text', 'Please provide text to emojify.');

    const mapping = {
      '0': ':zero:', '1': ':one:', '2': ':two:', '3': ':three:', '4': ':four:',
      '5': ':five:', '6': ':six:', '7': ':seven:', '8': ':eight:', '9': ':nine:',
      '!': ':exclamation:', '?': ':question:', ' ': '   '
    };

    let result = '';
    for (const char of text.toLowerCase()) {
      if (/[a-z]/.test(char)) {
        result += `:regional_indicator_${char}: `;
      } else if (mapping[char]) {
        result += `${mapping[char]} `;
      } else {
        result += `${char} `;
      }
    }

    if (result.length > 2000) {
      return ctx.sendError('Too Long', 'Emojified text exceeds 2000 characters limit.');
    }

    return ctx.reply({ content: result });
  }
}

module.exports = EmojifyCommand;
