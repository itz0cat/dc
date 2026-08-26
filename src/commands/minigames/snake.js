const { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType } = require('discord.js');
const Command = require('../Command.js');
const RotiEmbed = require('../../utils/embed.js');
const botConfig = require('../../config.js');

class SnakeCommand extends Command {
  constructor() {
    super({
      name: 'snake',
      description: 'Play classic Snake using directional buttons',
      category: 'Minigames',
      usage: 'snake',
      slashData: new SlashCommandBuilder()
        .setName('snake')
        .setDescription('Play Snake game')
    });
  }

  renderGrid(snake, apple, size = 6) {
    let grid = '';
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        if (snake[0].x === x && snake[0].y === y) {
          grid += '🟢';
        } else if (snake.some(s => s.x === x && s.y === y)) {
          grid += '🟩';
        } else if (apple.x === x && apple.y === y) {
          grid += '🍎';
        } else {
          grid += '⬛';
        }
      }
      grid += '\n';
    }
    return grid;
  }

  randomApple(snake, size = 6) {
    let x, y;
    do {
      x = Math.floor(Math.random() * size);
      y = Math.floor(Math.random() * size);
    } while (snake.some(s => s.x === x && s.y === y));
    return { x, y };
  }

  async execute(ctx) {
    const size = 6;
    let snake = [{ x: 2, y: 2 }];
    let apple = this.randomApple(snake, size);
    let score = 0;

    const getButtons = (disabled = false) => {
      const row1 = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId('s_none1').setLabel('⬛').setStyle(ButtonStyle.Secondary).setDisabled(true),
        new ButtonBuilder().setCustomId('s_up').setLabel('⬆️').setStyle(ButtonStyle.Primary).setDisabled(disabled),
        new ButtonBuilder().setCustomId('s_none2').setLabel('⬛').setStyle(ButtonStyle.Secondary).setDisabled(true)
      );
      const row2 = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId('s_left').setLabel('⬅️').setStyle(ButtonStyle.Primary).setDisabled(disabled),
        new ButtonBuilder().setCustomId('s_down').setLabel('⬇️').setStyle(ButtonStyle.Primary).setDisabled(disabled),
        new ButtonBuilder().setCustomId('s_right').setLabel('➡️').setStyle(ButtonStyle.Primary).setDisabled(disabled)
      );
      return [row1, row2];
    };

    const getEmbed = (isGameOver = false) => {
      const embed = new RotiEmbed()
        .setTitle('🐍 Snake Game')
        .setDescription(`${this.renderGrid(snake, apple, size)}\n\n**Score:** \`${score}\`\n${isGameOver ? '💥 **Game Over!** You crashed!' : 'Use the buttons below to guide your snake.'}`)
        .setColor(isGameOver ? botConfig.colors.error : botConfig.colors.teal);
      return embed;
    };

    let msg;
    if (ctx.isSlash) {
      msg = await ctx.raw.reply({ embeds: [getEmbed()], components: getButtons(), fetchReply: true });
    } else {
      msg = await ctx.channel.send({ embeds: [getEmbed()], components: getButtons() });
    }

    const collector = msg.createMessageComponentCollector({
      componentType: ComponentType.Button,
      time: 90000
    });

    collector.on('collect', async (btn) => {
      if (btn.user.id !== ctx.user.id) {
        return btn.reply({ content: '❌ Start your own game with `/snake`!', ephemeral: true });
      }

      let dx = 0, dy = 0;
      if (btn.customId === 's_up') dy = -1;
      if (btn.customId === 's_down') dy = 1;
      if (btn.customId === 's_left') dx = -1;
      if (btn.customId === 's_right') dx = 1;

      const newHead = { x: snake[0].x + dx, y: snake[0].y + dy };

      // Wall collision check
      if (newHead.x < 0 || newHead.x >= size || newHead.y < 0 || newHead.y >= size) {
        collector.stop('wall');
        return btn.update({ embeds: [getEmbed(true)], components: getButtons(true) });
      }

      // Self collision
      if (snake.some(s => s.x === newHead.x && s.y === newHead.y)) {
        collector.stop('self');
        return btn.update({ embeds: [getEmbed(true)], components: getButtons(true) });
      }

      snake.unshift(newHead);

      // Check apple eat
      if (newHead.x === apple.x && newHead.y === apple.y) {
        score += 10;
        apple = this.randomApple(snake, size);
      } else {
        snake.pop();
      }

      return btn.update({ embeds: [getEmbed()], components: getButtons() });
    });

    collector.on('end', (c, reason) => {
      if (reason === 'time') {
        msg.edit({ embeds: [getEmbed(true)], components: getButtons(true) }).catch(() => {});
      }
    });
  }
}

module.exports = SnakeCommand;
