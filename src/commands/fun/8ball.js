const { SlashCommandBuilder } = require('discord.js');
const Command = require('../Command.js');
const RotiEmbed = require('../../utils/embed.js');
const botConfig = require('../../config.js');

class EightBallCommand extends Command {
  constructor() {
    super({
      name: '8ball',
      description: 'Ask the magic 8-ball any question and get a fortune answer',
      category: 'Fun',
      aliases: ['magic8ball', 'ask'],
      usage: '8ball <question>',
      slashData: new SlashCommandBuilder()
        .setName('8ball')
        .setDescription('Ask the magic 8-ball a question')
        .addStringOption(opt => opt.setName('question').setDescription('Your question').setRequired(true))
    });
  }

  async execute(ctx, args) {
    const question = ctx.isSlash ? ctx.raw.options.getString('question') : args.join(' ');
    if (!question) return ctx.sendError('Missing Question', 'Please ask a question.');

    const answers = [
      'It is certain.', 'It is decidedly so.', 'Without a doubt.', 'Yes definitely.',
      'You may rely on it.', 'As I see it, yes.', 'Most likely.', 'Outlook good.',
      'Yes.', 'Signs point to yes.', 'Reply hazy, try again.', 'Ask again later.',
      'Better not tell you now.', 'Cannot predict now.', 'Concentrate and ask again.',
      'Don\'t count on it.', 'My reply is no.', 'My sources say no.',
      'Outlook not so good.', 'Very doubtful.'
    ];

    const answer = answers[Math.floor(Math.random() * answers.length)];

    const embed = new RotiEmbed()
      .setTitle('🎱 Magic 8-Ball')
      .addFields(
        { name: '❓ Question', value: question },
        { name: '🔮 Answer', value: answer }
      )
      .setColor(botConfig.colors.teal);

    return ctx.reply({ embeds: [embed] });
  }
}

module.exports = EightBallCommand;
