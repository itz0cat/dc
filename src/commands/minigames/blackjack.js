const { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType } = require('discord.js');
const Command = require('../Command.js');
const RotiEmbed = require('../../utils/embed.js');
const botConfig = require('../../config.js');

class BlackjackCommand extends Command {
  constructor() {
    super({
      name: 'blackjack',
      description: 'Play a full game of Blackjack against the dealer with interactive buttons',
      category: 'Minigames',
      aliases: ['bj'],
      usage: 'blackjack',
      slashData: new SlashCommandBuilder()
        .setName('blackjack')
        .setDescription('Play a game of Blackjack')
    });
  }

  createDeck() {
    const suits = ['♠️', '♥️', '♦️', '♣️'];
    const values = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
    const deck = [];
    for (const s of suits) {
      for (const v of values) {
        deck.push({ suit: s, value: v });
      }
    }
    return deck.sort(() => Math.random() - 0.5);
  }

  getHandValue(hand) {
    let score = 0;
    let aces = 0;
    for (const card of hand) {
      if (card.value === 'A') {
        aces += 1;
        score += 11;
      } else if (['K', 'Q', 'J'].includes(card.value)) {
        score += 10;
      } else {
        score += parseInt(card.value);
      }
    }
    while (score > 21 && aces > 0) {
      score -= 10;
      aces -= 1;
    }
    return score;
  }

  formatHand(hand, hideFirst = false) {
    if (hideFirst) {
      return `\`[ ? ]\` ${hand.slice(1).map(c => `\`[ ${c.value}${c.suit} ]\``).join(' ')}`;
    }
    return hand.map(c => `\`[ ${c.value}${c.suit} ]\``).join(' ');
  }

  async execute(ctx) {
    const deck = this.createDeck();
    const playerHand = [deck.pop(), deck.pop()];
    const dealerHand = [deck.pop(), deck.pop()];

    const getEmbed = (isGameOver = false, result = '') => {
      const playerScore = this.getHandValue(playerHand);
      const dealerScore = isGameOver ? this.getHandValue(dealerHand) : '?';

      const embed = new RotiEmbed()
        .setTitle('🃏 Blackjack')
        .addFields(
          { name: `Player's Hand (${playerScore})`, value: this.formatHand(playerHand), inline: false },
          { name: `Dealer's Hand (${dealerScore})`, value: this.formatHand(dealerHand, !isGameOver), inline: false }
        )
        .setColor(botConfig.colors.teal);

      if (isGameOver) {
        embed.setDescription(`### ${result}`);
      }
      return embed;
    };

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId('bj_hit').setLabel('Hit').setStyle(ButtonStyle.Success),
      new ButtonBuilder().setCustomId('bj_stand').setLabel('Stand').setStyle(ButtonStyle.Danger)
    );

    let msg;
    if (ctx.isSlash) {
      msg = await ctx.raw.reply({ embeds: [getEmbed()], components: [row], fetchReply: true });
    } else {
      msg = await ctx.channel.send({ embeds: [getEmbed()], components: [row] });
    }

    const collector = msg.createMessageComponentCollector({
      componentType: ComponentType.Button,
      time: 60000
    });

    collector.on('collect', async (btn) => {
      if (btn.user.id !== ctx.user.id) {
        return btn.reply({ content: '❌ Start your own game with `/blackjack`!', ephemeral: true });
      }

      if (btn.customId === 'bj_hit') {
        playerHand.push(deck.pop());
        const score = this.getHandValue(playerHand);

        if (score > 21) {
          collector.stop('bust');
          return btn.update({ embeds: [getEmbed(true, '💥 Bust! You went over 21. Dealer wins!')], components: [] });
        } else if (score === 21) {
          collector.stop('21');
          return btn.update({ embeds: [getEmbed(true, '🎉 21! Blackjack! You win!')], components: [] });
        } else {
          return btn.update({ embeds: [getEmbed()], components: [row] });
        }
      }

      if (btn.customId === 'bj_stand') {
        collector.stop('stand');
        // Dealer draws until 17
        while (this.getHandValue(dealerHand) < 17) {
          dealerHand.push(deck.pop());
        }

        const playerScore = this.getHandValue(playerHand);
        const dealerScore = this.getHandValue(dealerHand);

        let result = '';
        if (dealerScore > 21) {
          result = '🎉 Dealer Busted! You win!';
        } else if (dealerScore > playerScore) {
          result = '❌ Dealer wins!';
        } else if (playerScore > dealerScore) {
          result = '🎉 You beat the dealer! You win!';
        } else {
          result = '🤝 Push! It is a tie!';
        }

        return btn.update({ embeds: [getEmbed(true, result)], components: [] });
      }
    });

    collector.on('end', (c, reason) => {
      if (reason === 'time') {
        msg.edit({ components: [] }).catch(() => {});
      }
    });
  }
}

module.exports = BlackjackCommand;
