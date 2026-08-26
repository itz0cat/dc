const { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType } = require('discord.js');
const Command = require('../Command.js');
const RotiEmbed = require('../../utils/embed.js');
const botConfig = require('../../config.js');

class ConnectFourCommand extends Command {
  constructor() {
    super({
      name: 'connectfour',
      description: 'Play Connect 4 with interactive buttons against another member',
      category: 'Minigames',
      aliases: ['c4'],
      usage: 'connectfour <opponent>',
      slashData: new SlashCommandBuilder()
        .setName('connectfour')
        .setDescription('Play Connect 4 against a friend')
        .addUserOption(opt => opt.setName('user').setDescription('Opponent to play against').setRequired(true))
    });
  }

  renderBoard(board) {
    const emojis = { 0: '⚪', 1: '🔴', 2: '🟡' };
    let str = '';
    for (let r = 0; r < 6; r++) {
      for (let c = 0; c < 7; c++) {
        str += emojis[board[r][c]] + ' ';
      }
      str += '\n';
    }
    str += '1️⃣ 2️⃣ 3️⃣ 4️⃣ 5️⃣ 6️⃣ 7️⃣';
    return str;
  }

  checkWin(board, player) {
    // Horizontal
    for (let r = 0; r < 6; r++) {
      for (let c = 0; c < 4; c++) {
        if (board[r][c] === player && board[r][c+1] === player && board[r][c+2] === player && board[r][c+3] === player) return true;
      }
    }
    // Vertical
    for (let r = 0; r < 3; r++) {
      for (let c = 0; c < 7; c++) {
        if (board[r][c] === player && board[r+1][c] === player && board[r+2][c] === player && board[r+3][c] === player) return true;
      }
    }
    // Diagonal down-right
    for (let r = 0; r < 3; r++) {
      for (let c = 0; c < 4; c++) {
        if (board[r][c] === player && board[r+1][c+1] === player && board[r+2][c+2] === player && board[r+3][c+3] === player) return true;
      }
    }
    // Diagonal up-right
    for (let r = 3; r < 6; r++) {
      for (let c = 0; c < 4; c++) {
        if (board[r][c] === player && board[r-1][c+1] === player && board[r-2][c+2] === player && board[r-3][c+3] === player) return true;
      }
    }
    return false;
  }

  async execute(ctx, args) {
    const opponent = ctx.isSlash ? ctx.raw.options.getUser('user') : ctx.raw.mentions.users.first();
    if (!opponent || opponent.id === ctx.user.id || opponent.bot) {
      return ctx.sendError('Invalid Opponent', 'Please mention a member to challenge.');
    }

    const board = Array(6).fill(null).map(() => Array(7).fill(0));
    let turn = ctx.user.id; // 1 = player 1, 2 = player 2

    const getButtons = (disabled = false) => {
      const row1 = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId('c4_0').setLabel('1').setStyle(ButtonStyle.Primary).setDisabled(disabled),
        new ButtonBuilder().setCustomId('c4_1').setLabel('2').setStyle(ButtonStyle.Primary).setDisabled(disabled),
        new ButtonBuilder().setCustomId('c4_2').setLabel('3').setStyle(ButtonStyle.Primary).setDisabled(disabled),
        new ButtonBuilder().setCustomId('c4_3').setLabel('4').setStyle(ButtonStyle.Primary).setDisabled(disabled)
      );
      const row2 = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId('c4_4').setLabel('5').setStyle(ButtonStyle.Primary).setDisabled(disabled),
        new ButtonBuilder().setCustomId('c4_5').setLabel('6').setStyle(ButtonStyle.Primary).setDisabled(disabled),
        new ButtonBuilder().setCustomId('c4_6').setLabel('7').setStyle(ButtonStyle.Primary).setDisabled(disabled)
      );
      return [row1, row2];
    };

    const getEmbed = (status = null) => {
      const pColor = turn === ctx.user.id ? '🔴' : '🟡';
      return new RotiEmbed()
        .setTitle('🔴 Connect Four 🟡')
        .setDescription(`${this.renderBoard(board)}\n\n${status || `**Current Turn:** ${pColor} <@${turn}>`}`)
        .addFields(
          { name: 'Player 1 (🔴)', value: `<@${ctx.user.id}>`, inline: true },
          { name: 'Player 2 (🟡)', value: `<@${opponent.id}>`, inline: true }
        )
        .setColor(botConfig.colors.teal);
    };

    let msg;
    if (ctx.isSlash) {
      msg = await ctx.raw.reply({ embeds: [getEmbed()], components: getButtons(), fetchReply: true });
    } else {
      msg = await ctx.channel.send({ embeds: [getEmbed()], components: getButtons() });
    }

    const collector = msg.createMessageComponentCollector({
      componentType: ComponentType.Button,
      time: 120000
    });

    collector.on('collect', async (btn) => {
      if (btn.user.id !== turn) {
        return btn.reply({ content: '⏳ It is not your turn!', ephemeral: true });
      }

      const col = parseInt(btn.customId.split('_')[1]);
      const pNum = (turn === ctx.user.id) ? 1 : 2;

      // Drop piece
      let placedRow = -1;
      for (let r = 5; r >= 0; r--) {
        if (board[r][col] === 0) {
          board[r][col] = pNum;
          placedRow = r;
          break;
        }
      }

      if (placedRow === -1) {
        return btn.reply({ content: '❌ That column is already full!', ephemeral: true });
      }

      if (this.checkWin(board, pNum)) {
        collector.stop('win');
        const winner = turn === ctx.user.id ? ctx.user : opponent;
        return btn.update({ embeds: [getEmbed(`🏆 **Victory!** <@${winner.id}> connected four!`)], components: getButtons(true) });
      }

      turn = (turn === ctx.user.id) ? opponent.id : ctx.user.id;
      return btn.update({ embeds: [getEmbed()], components: getButtons() });
    });

    collector.on('end', (c, reason) => {
      if (reason === 'time') {
        msg.edit({ embeds: [getEmbed('⏱️ Connect Four game timed out.')], components: getButtons(true) }).catch(() => {});
      }
    });
  }
}

module.exports = ConnectFourCommand;
