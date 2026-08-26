const { SlashCommandBuilder } = require('discord.js');
const Command = require('../Command.js');
const RotiEmbed = require('../../utils/embed.js');
const botConfig = require('../../config.js');

class CryptoCommand extends Command {
  constructor() {
    super({
      name: 'crypto',
      description: 'Check live cryptocurrency prices, market caps, and 24h percentage changes',
      category: 'Utility',
      aliases: ['bitcoin', 'btc', 'eth', 'sol'],
      usage: 'crypto [coin (e.g. bitcoin, ethereum, solana)]',
      slashData: new SlashCommandBuilder()
        .setName('crypto')
        .setDescription('Check live cryptocurrency prices')
        .addStringOption(opt => opt.setName('coin').setDescription('Cryptocurrency (e.g. bitcoin, ethereum, solana)'))
    });
  }

  async execute(ctx, args) {
    const coin = ctx.isSlash ? (ctx.raw.options.getString('coin') || 'bitcoin') : (args[0]?.toLowerCase() || 'bitcoin');

    await ctx.defer();
    try {
      const res = await fetch(`https://api.coingecko.com/api/v3/coins/${encodeURIComponent(coin)}`);
      if (!res.ok) {
        // Fallback simple price
        const simpleRes = await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${encodeURIComponent(coin)}&vs_currencies=usd&include_24hr_change=true`);
        const simpleData = await simpleRes.json();
        if (simpleData[coin]) {
          const price = simpleData[coin].usd;
          const change = simpleData[coin].usd_24h_change?.toFixed(2);
          const embed = new RotiEmbed()
            .setTitle(`🪙 Crypto Price: ${coin.toUpperCase()}`)
            .setDescription(`**Price:** $${price.toLocaleString()} USD\n**24h Change:** ${change >= 0 ? '📈 +' : '📉 '}${change}%`)
            .setColor(botConfig.colors.teal);
          return ctx.reply({ embeds: [embed] });
        }
        return ctx.sendError('Not Found', `Cryptocurrency \`${coin}\` not found on CoinGecko.`);
      }

      const data = await res.json();
      const priceUsd = data.market_data.current_price.usd;
      const change24h = data.market_data.price_change_percentage_24h?.toFixed(2);
      const high24h = data.market_data.high_24h.usd;
      const low24h = data.market_data.low_24h.usd;
      const marketCap = data.market_data.market_cap.usd;

      const embed = new RotiEmbed()
        .setTitle(`🪙 ${data.name} (${data.symbol.toUpperCase()})`)
        .setThumbnail(data.image?.large)
        .addFields(
          { name: 'Current Price', value: `\`$${priceUsd.toLocaleString()} USD\``, inline: true },
          { name: '24h Change', value: `\`${change24h >= 0 ? '+' : ''}${change24h}%\``, inline: true },
          { name: 'Market Cap Rank', value: `\`#${data.market_cap_rank || 'N/A'}\``, inline: true },
          { name: '24h High', value: `\`$${high24h.toLocaleString()}\``, inline: true },
          { name: '24h Low', value: `\`$${low24h.toLocaleString()}\``, inline: true },
          { name: 'Market Cap', value: `\`$${marketCap.toLocaleString()}\``, inline: true }
        )
        .setColor(change24h >= 0 ? botConfig.colors.teal : botConfig.colors.error);

      return ctx.reply({ embeds: [embed] });
    } catch (e) {
      return ctx.sendError('API Error', 'Failed to retrieve cryptocurrency market data.');
    }
  }
}

module.exports = CryptoCommand;
