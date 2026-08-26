const { SlashCommandBuilder } = require('discord.js');
const Command = require('../Command.js');
const RotiEmbed = require('../../utils/embed.js');
const botConfig = require('../../config.js');

class CalcCommand extends Command {
  constructor() {
    super({
      name: 'calc',
      description: 'Calculate mathematical expressions safely',
      category: 'Utility',
      aliases: ['math', 'calculate'],
      usage: 'calc <expression>',
      slashData: new SlashCommandBuilder()
        .setName('calc')
        .setDescription('Calculate math expression')
        .addStringOption(opt => opt.setName('expression').setDescription('Math expression to solve (e.g. 5 * (12 + 8))').setRequired(true))
    });
  }

  async execute(ctx, args) {
    const expr = ctx.isSlash ? ctx.raw.options.getString('expression') : args.join(' ');
    if (!expr) return ctx.sendError('Missing Expression', 'Please provide a math expression.');

    // Safe mathematical evaluation (allow only numbers, basic arithmetic operators, parentheses, decimal point, math functions)
    if (!/^[0-9+\-*/().^% \t\r\n]|Math\.(sin|cos|tan|sqrt|pow|abs|round|floor|ceil|PI|E)+$/i.test(expr)) {
      return ctx.sendError('Invalid Expression', 'Only standard math calculations and numbers are allowed.');
    }

    try {
      // Evaluate in clean context
      const sanitized = expr.replace(/\^/g, '**');
      const result = Function(`"use strict"; return (${sanitized});`)();

      if (typeof result !== 'number' || isNaN(result) || !isFinite(result)) {
        return ctx.sendError('Math Error', 'Could not evaluate expression to a valid finite number.');
      }

      const embed = new RotiEmbed()
        .setTitle('🧮 Math Calculator')
        .addFields(
          { name: 'Expression', value: `\`\`\`${expr}\`\`\`` },
          { name: 'Result', value: `\`\`\`${result}\`\`\`` }
        )
        .setColor(botConfig.colors.teal);

      return ctx.reply({ embeds: [embed] });
    } catch (err) {
      return ctx.sendError('Evaluation Error', 'Failed to calculate math expression.');
    }
  }
}

module.exports = CalcCommand;
