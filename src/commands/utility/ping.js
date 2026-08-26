const { SlashCommandBuilder } = require('discord.js');
const Command = require('../Command.js');
const RotiEmbed = require('../../utils/embed.js');
const botConfig = require('../../config.js');

class PingCommand extends Command {
  constructor() {
    super({
      name: 'ping',
      description: 'Shows the current WebSocket and API response latency',
      category: 'Utility',
      aliases: ['latency'],
      usage: 'ping',
      slashData: new SlashCommandBuilder()
        .setName('ping')
        .setDescription('Check bot latency')
    });
  }

  async execute(ctx) {
    const wsPing = Math.round(ctx.client.ws.ping);
    const start = Date.now();

    const embed = new RotiEmbed()
      .setTitle('🏓 Pong!')
      .addFields(
        { name: 'WebSocket Latency', value: `\`${wsPing}ms\``, inline: true },
        { name: 'API Latency', value: `\`${Date.now() - start}ms\``, inline: true }
      )
      .setColor(botConfig.colors.teal);

    return ctx.reply({ embeds: [embed] });
  }
}

module.exports = PingCommand;
