const { SlashCommandBuilder } = require('discord.js');
const Command = require('../Command.js');
const RotiEmbed = require('../../utils/embed.js');
const botConfig = require('../../config.js');

class ChooseCommand extends Command {
  constructor() {
    super({
      name: 'choose',
      description: 'Let R.O.T.I choose randomly between two or more options',
      category: 'Fun',
      aliases: ['pick'],
      usage: 'choose <choice1>, <choice2>, ...',
      slashData: new SlashCommandBuilder()
        .setName('choose')
        .setDescription('Choose between multiple options')
        .addStringOption(opt => opt.setName('choices').setDescription('Choices separated by comma or space').setRequired(true))
    });
  }

  async execute(ctx, args) {
    const raw = ctx.isSlash ? ctx.raw.options.getString('choices') : args.join(' ');
    if (!raw) return ctx.sendError('Missing Choices', 'Please provide options to choose between (e.g. `choose pizza, burger, tacos`).');

    const choices = raw.includes(',') ? raw.split(',').map(c => c.trim()).filter(Boolean) : raw.split(' ').map(c => c.trim()).filter(Boolean);
    if (choices.length < 2) return ctx.sendError('Not Enough Choices', 'Please provide at least 2 choices.');

    const picked = choices[Math.floor(Math.random() * choices.length)];

    const embed = new RotiEmbed()
      .setTitle('🤔 R.O.T.I Chooses...')
      .setDescription(`I picked: **${picked}**!`)
      .setColor(botConfig.colors.teal);

    return ctx.reply({ embeds: [embed] });
  }
}

module.exports = ChooseCommand;
