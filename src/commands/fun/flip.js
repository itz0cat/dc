const { SlashCommandBuilder } = require('discord.js');
const Command = require('../Command.js');
const RotiEmbed = require('../../utils/embed.js');
const botConfig = require('../../config.js');

class FlipCommand extends Command {
  constructor() {
    super({
      name: 'flip',
      description: 'Flip a coin and get Heads or Tails',
      category: 'Fun',
      aliases: ['coinflip'],
      usage: 'flip',
      slashData: new SlashCommandBuilder()
        .setName('flip')
        .setDescription('Flip a coin')
    });
  }

  async execute(ctx) {
    const result = Math.random() < 0.5 ? 'Heads' : 'Tails';
    const icon = result === 'Heads' ? '🪙' : '🪙';

    const embed = new RotiEmbed()
      .setTitle(`${icon} Coin Flip`)
      .setDescription(`The coin landed on: **${result}**!`)
      .setColor(botConfig.colors.teal);

    return ctx.reply({ embeds: [embed] });
  }
}

module.exports = FlipCommand;
