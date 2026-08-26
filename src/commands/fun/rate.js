const { SlashCommandBuilder } = require('discord.js');
const Command = require('../Command.js');
const RotiEmbed = require('../../utils/embed.js');
const botConfig = require('../../config.js');

class RateCommand extends Command {
  constructor() {
    super({
      name: 'rate',
      description: 'Rate anything or anyone on a scale of 0 to 100%',
      category: 'Fun',
      usage: 'rate [something]',
      slashData: new SlashCommandBuilder()
        .setName('rate')
        .setDescription('Rate anything out of 100%')
        .addStringOption(opt => opt.setName('target').setDescription('What or who to rate').setRequired(true))
    });
  }

  async execute(ctx, args) {
    const target = ctx.isSlash ? ctx.raw.options.getString('target') : (args.join(' ') || 'You');
    
    // Pseudo-deterministic or random rating
    const score = Math.floor(Math.random() * 101);

    const embed = new RotiEmbed()
      .setTitle('💯 Rate Machine')
      .setDescription(`I rate **${target}**: \`${score}/100\`! ${score > 80 ? '🔥 Legendary!' : (score > 50 ? '✨ Pretty decent!' : '😬 Could be better!')}`)
      .setColor(botConfig.colors.teal);

    return ctx.reply({ embeds: [embed] });
  }
}

module.exports = RateCommand;
