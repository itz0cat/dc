const { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType } = require('discord.js');
const Command = require('../Command.js');
const RotiEmbed = require('../../utils/embed.js');
const botConfig = require('../../config.js');

class TriviaCommand extends Command {
  constructor() {
    super({
      name: 'trivia',
      description: 'Test your general knowledge with an interactive trivia question',
      category: 'Minigames',
      usage: 'trivia',
      slashData: new SlashCommandBuilder()
        .setName('trivia')
        .setDescription('Play a trivia question')
    });
  }

  async execute(ctx) {
    const questions = [
      {
        q: 'Which planet is known as the Red Planet?',
        options: ['Mars', 'Venus', 'Jupiter', 'Mercury'],
        correct: 0
      },
      {
        q: 'What is the largest ocean on Earth?',
        options: ['Atlantic Ocean', 'Indian Ocean', 'Pacific Ocean', 'Arctic Ocean'],
        correct: 2
      },
      {
        q: 'How many hearts does an octopus have?',
        options: ['1', '2', '3', '4'],
        correct: 2
      },
      {
        q: 'What is the capital city of Australia?',
        options: ['Sydney', 'Melbourne', 'Canberra', 'Brisbane'],
        correct: 2
      },
      {
        q: 'Which element has the chemical symbol "Au"?',
        options: ['Silver', 'Gold', 'Copper', 'Aluminum'],
        correct: 1
      },
      {
        q: 'Who painted the Mona Lisa?',
        options: ['Leonardo da Vinci', 'Pablo Picasso', 'Vincent van Gogh', 'Michelangelo'],
        correct: 0
      }
    ];

    const item = questions[Math.floor(Math.random() * questions.length)];

    const row = new ActionRowBuilder();
    item.options.forEach((opt, idx) => {
      row.addComponents(
        new ButtonBuilder().setCustomId(`triv_${idx}`).setLabel(`${['A', 'B', 'C', 'D'][idx]}: ${opt}`).setStyle(ButtonStyle.Primary)
      );
    });

    const embed = new RotiEmbed()
      .setTitle('🧠 Trivia Time!')
      .setDescription(`**${item.q}**\n\nYou have **20 seconds** to choose the right answer!`)
      .setColor(botConfig.colors.teal);

    let msg;
    if (ctx.isSlash) {
      msg = await ctx.raw.reply({ embeds: [embed], components: [row], fetchReply: true });
    } else {
      msg = await ctx.channel.send({ embeds: [embed], components: [row] });
    }

    const collector = msg.createMessageComponentCollector({
      componentType: ComponentType.Button,
      time: 20000
    });

    collector.on('collect', async (btn) => {
      if (btn.user.id !== ctx.user.id) {
        return btn.reply({ content: '❌ Start your own trivia with `?trivia`!', ephemeral: true });
      }

      const selected = parseInt(btn.customId.split('_')[1]);
      const isCorrect = selected === item.correct;

      const disabledRow = new ActionRowBuilder();
      item.options.forEach((opt, idx) => {
        let style = ButtonStyle.Secondary;
        if (idx === item.correct) style = ButtonStyle.Success;
        else if (idx === selected && !isCorrect) style = ButtonStyle.Danger;

        disabledRow.addComponents(
          new ButtonBuilder().setCustomId(`triv_dis_${idx}`).setLabel(`${['A', 'B', 'C', 'D'][idx]}: ${opt}`).setStyle(style).setDisabled(true)
        );
      });

      const resEmbed = new RotiEmbed()
        .setTitle(isCorrect ? '🎉 Correct Answer!' : '❌ Incorrect Answer!')
        .setDescription(`**${item.q}**\n\n${isCorrect ? `Great job <@${ctx.user.id}>! You got it right!` : `Oops! The correct answer was **${item.options[item.correct]}**.`}`)
        .setColor(isCorrect ? botConfig.colors.success : botConfig.colors.error);

      collector.stop('answered');
      return btn.update({ embeds: [resEmbed], components: [disabledRow] });
    });

    collector.on('end', (c, reason) => {
      if (reason === 'time') {
        const timeoutEmbed = new RotiEmbed()
          .setTitle('⏰ Time Up!')
          .setDescription(`**${item.q}**\n\nCorrect answer was: **${item.options[item.correct]}**`)
          .setColor(botConfig.colors.teal);
        msg.edit({ embeds: [timeoutEmbed], components: [] }).catch(() => {});
      }
    });
  }
}

module.exports = TriviaCommand;
