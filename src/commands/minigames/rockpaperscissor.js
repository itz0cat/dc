const { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType } = require('discord.js');
const Command = require('../Command.js');
const RotiEmbed = require('../../utils/embed.js');
const botConfig = require('../../config.js');

class RockPaperScissorCommand extends Command {
  constructor() {
    super({
      name: 'rockpaperscissor',
      description: 'Play Rock Paper Scissors with interactive buttons against the bot or a friend',
      category: 'Minigames',
      aliases: ['rps'],
      usage: 'rockpaperscissor [opponent]',
      slashData: new SlashCommandBuilder()
        .setName('rockpaperscissor')
        .setDescription('Play Rock Paper Scissors')
        .addUserOption(opt => opt.setName('user').setDescription('Optional opponent to challenge'))
    });
  }

  async execute(ctx, args) {
    const opponent = ctx.isSlash ? ctx.raw.options.getUser('user') : ctx.raw.mentions.users.first();
    const isPvP = opponent && opponent.id !== ctx.user.id && !opponent.bot;

    const choices = ['rock', 'paper', 'scissors'];
    const emojis = { rock: '🪨 Rock', paper: '📄 Paper', scissors: '✂️ Scissors' };

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId('rps_rock').setLabel('Rock').setEmoji('🪨').setStyle(ButtonStyle.Primary),
      new ButtonBuilder().setCustomId('rps_paper').setLabel('Paper').setEmoji('📄').setStyle(ButtonStyle.Primary),
      new ButtonBuilder().setCustomId('rps_scissors').setLabel('Scissors').setEmoji('✂️').setStyle(ButtonStyle.Primary)
    );

    if (!isPvP) {
      // Play vs Bot
      const embed = new RotiEmbed()
        .setTitle('✂️ Rock Paper Scissors vs Bot')
        .setDescription('Choose your move by clicking one of the buttons below!')
        .setColor(botConfig.colors.teal);

      let msg;
      if (ctx.isSlash) {
        msg = await ctx.raw.reply({ embeds: [embed], components: [row], fetchReply: true });
      } else {
        msg = await ctx.channel.send({ embeds: [embed], components: [row] });
      }

      const collector = msg.createMessageComponentCollector({
        componentType: ComponentType.Button,
        time: 30000
      });

      collector.on('collect', async (btn) => {
        if (btn.user.id !== ctx.user.id) return btn.reply({ content: '❌ Start your own game with `/rps`!', ephemeral: true });

        const playerMove = btn.customId.replace('rps_', '');
        const botMove = choices[Math.floor(Math.random() * choices.length)];

        let result = '';
        if (playerMove === botMove) {
          result = '🤝 It\'s a Tie!';
        } else if (
          (playerMove === 'rock' && botMove === 'scissors') ||
          (playerMove === 'paper' && botMove === 'rock') ||
          (playerMove === 'scissors' && botMove === 'paper')
        ) {
          result = '🎉 You Win!';
        } else {
          result = '❌ Bot Wins!';
        }

        const resEmbed = new RotiEmbed()
          .setTitle('✂️ Rock Paper Scissors Result')
          .setDescription(`**Your Choice:** ${emojis[playerMove]}\n**Bot Choice:** ${emojis[botMove]}\n\n### ${result}`)
          .setColor(botConfig.colors.teal);

        return btn.update({ embeds: [resEmbed], components: [] });
      });
    } else {
      // PvP
      let player1Choice = null;
      let player2Choice = null;

      const embed = new RotiEmbed()
        .setTitle('✂️ Rock Paper Scissors PvP')
        .setDescription(`<@${ctx.user.id}> challenged <@${opponent.id}>!\nBoth players, click your choice below!`)
        .setColor(botConfig.colors.teal);

      let msg;
      if (ctx.isSlash) {
        msg = await ctx.raw.reply({ embeds: [embed], components: [row], fetchReply: true });
      } else {
        msg = await ctx.channel.send({ embeds: [embed], components: [row] });
      }

      const collector = msg.createMessageComponentCollector({
        componentType: ComponentType.Button,
        time: 45000
      });

      collector.on('collect', async (btn) => {
        if (btn.user.id !== ctx.user.id && btn.user.id !== opponent.id) {
          return btn.reply({ content: '❌ You are not part of this duel!', ephemeral: true });
        }

        const move = btn.customId.replace('rps_', '');
        if (btn.user.id === ctx.user.id) player1Choice = move;
        if (btn.user.id === opponent.id) player2Choice = move;

        await btn.reply({ content: `✅ You selected **${emojis[move]}**!`, ephemeral: true });

        if (player1Choice && player2Choice) {
          collector.stop('both');
          let result = '';
          if (player1Choice === player2Choice) {
            result = '🤝 It\'s a Tie!';
          } else if (
            (player1Choice === 'rock' && player2Choice === 'scissors') ||
            (player1Choice === 'paper' && player2Choice === 'rock') ||
            (player1Choice === 'scissors' && player2Choice === 'paper')
          ) {
            result = `🏆 <@${ctx.user.id}> Wins!`;
          } else {
            result = `🏆 <@${opponent.id}> Wins!`;
          }

          const resEmbed = new RotiEmbed()
            .setTitle('✂️ Duel Result')
            .setDescription(`<@${ctx.user.id}> chose: ${emojis[player1Choice]}\n<@${opponent.id}> chose: ${emojis[player2Choice]}\n\n### ${result}`)
            .setColor(botConfig.colors.teal);

          msg.edit({ embeds: [resEmbed], components: [] }).catch(() => {});
        }
      });
    }
  }
}

module.exports = RockPaperScissorCommand;
