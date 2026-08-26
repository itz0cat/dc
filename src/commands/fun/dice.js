const { SlashCommandBuilder } = require('discord.js');
const Command = require('../Command.js');
const RotiEmbed = require('../../utils/embed.js');
const botConfig = require('../../config.js');

class DiceCommand extends Command {
  constructor() {
    super({
      name: 'dice',
      description: 'Roll one or multiple dice with customized sides',
      category: 'Fun',
      aliases: ['roll'],
      usage: 'dice [sides] [count]',
      slashData: new SlashCommandBuilder()
        .setName('dice')
        .setDescription('Roll some dice')
        .addIntegerOption(opt => opt.setName('sides').setDescription('Number of sides (default: 6)').setMinValue(2).setMaxValue(100))
        .addIntegerOption(opt => opt.setName('count').setDescription('Number of dice to roll (default: 1)').setMinValue(1).setMaxValue(10))
    });
  }

  async execute(ctx, args) {
    const sides = ctx.isSlash ? (ctx.raw.options.getInteger('sides') || 6) : (parseInt(args[0]) || 6);
    const count = ctx.isSlash ? (ctx.raw.options.getInteger('count') || 1) : (parseInt(args[1]) || 1);

    const rolls = [];
    let total = 0;
    for (let i = 0; i < count; i++) {
      const roll = Math.floor(Math.random() * sides) + 1;
      rolls.push(roll);
      total += roll;
    }

    const embed = new RotiEmbed()
      .setTitle('🎲 Dice Roll')
      .setDescription(`Rolled **${count}d${sides}**:\n**Rolls:** ${rolls.join(', ')}\n**Total:** \`${total}\``)
      .setColor(botConfig.colors.teal);

    return ctx.reply({ embeds: [embed] });
  }
}

module.exports = DiceCommand;
