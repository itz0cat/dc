const { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType } = require('discord.js');
const Command = require('../Command.js');
const RotiEmbed = require('../../utils/embed.js');
const botConfig = require('../../config.js');

class TicTacToeCommand extends Command {
  constructor() {
    super({
      name: 'tictactoe',
      description: 'Play Tic-Tac-Toe with interactive buttons against another member',
      category: 'Minigames',
      aliases: ['ttt'],
      usage: 'tictactoe <opponent>',
      slashData: new SlashCommandBuilder()
        .setName('tictactoe')
        .setDescription('Play Tic Tac Toe against a friend')
        .addUserOption(opt => opt.setName('user').setDescription('Opponent to play with').setRequired(true))
    });
  }

  checkWinner(board) {
    const lines = [
      [0, 1, 2], [3, 4, 5], [6, 7, 8], // Rows
      [0, 3, 6], [1, 4, 7], [2, 5, 8], // Cols
      [0, 4, 8], [2, 4, 6]             // Diagonals
    ];
    for (const [a, b, c] of lines) {
      if (board[a] && board[a] === board[b] && board[a] === board[c]) {
        return board[a];
      }
    }
    if (board.every(cell => cell !== null)) return 'tie';
    return null;
  }

  async execute(ctx, args) {
    const opponent = ctx.isSlash ? ctx.raw.options.getUser('user') : ctx.raw.mentions.users.first();
    if (!opponent || opponent.id === ctx.user.id || opponent.bot) {
      return ctx.sendError('Invalid Opponent', 'Please mention another server member to play against.');
    }

    const board = Array(9).fill(null);
    let turn = ctx.user.id; // X starts

    const getGrid = (disabled = false) => {
      const rows = [];
      for (let r = 0; r < 3; r++) {
        const row = new ActionRowBuilder();
        for (let c = 0; c < 3; c++) {
          const idx = r * 3 + c;
          const val = board[idx];
          const btn = new ButtonBuilder()
            .setCustomId(`ttt_${idx}`)
            .setStyle(val === 'X' ? ButtonStyle.Danger : (val === 'O' ? ButtonStyle.Success : ButtonStyle.Secondary))
            .setLabel(val || '➖')
            .setDisabled(disabled || val !== null);
          row.addComponents(btn);
        }
        rows.push(row);
      }
      return rows;
    };

    const getEmbed = (status = null) => {
      const embed = new RotiEmbed()
        .setTitle('❌ Tic Tac Toe ⭕')
        .setDescription(status || `**Current Turn:** <@${turn}> (${turn === ctx.user.id ? '❌ (X)' : '⭕ (O)'})`)
        .addFields(
          { name: 'Player 1 (❌)', value: `<@${ctx.user.id}>`, inline: true },
          { name: 'Player 2 (⭕)', value: `<@${opponent.id}>`, inline: true }
        )
        .setColor(botConfig.colors.teal);
      return embed;
    };

    let msg;
    if (ctx.isSlash) {
      msg = await ctx.raw.reply({ embeds: [getEmbed()], components: getGrid(), fetchReply: true });
    } else {
      msg = await ctx.channel.send({ embeds: [getEmbed()], components: getGrid() });
    }

    const collector = msg.createMessageComponentCollector({
      componentType: ComponentType.Button,
      time: 90000
    });

    collector.on('collect', async (btn) => {
      if (btn.user.id !== turn) {
        return btn.reply({ content: '⏳ It is not your turn!', ephemeral: true });
      }

      const idx = parseInt(btn.customId.split('_')[1]);
      board[idx] = (turn === ctx.user.id) ? 'X' : 'O';

      const winner = this.checkWinner(board);
      if (winner) {
        collector.stop(winner);
        let endMsg = '';
        if (winner === 'tie') {
          endMsg = '🤝 The game ended in a **Tie**!';
        } else {
          const winningUser = winner === 'X' ? ctx.user : opponent;
          endMsg = `🏆 <@${winningUser.id}> won the game!`;
        }
        return btn.update({ embeds: [getEmbed(endMsg)], components: getGrid(true) });
      }

      turn = (turn === ctx.user.id) ? opponent.id : ctx.user.id;
      return btn.update({ embeds: [getEmbed()], components: getGrid() });
    });

    collector.on('end', (c, reason) => {
      if (reason === 'time') {
        msg.edit({ embeds: [getEmbed('⏱️ Game timed out due to inactivity.')], components: getGrid(true) }).catch(() => {});
      }
    });
  }
}

module.exports = TicTacToeCommand;
