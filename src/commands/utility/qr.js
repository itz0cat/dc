const { SlashCommandBuilder } = require('discord.js');
const Command = require('../Command.js');
const RotiEmbed = require('../../utils/embed.js');
const botConfig = require('../../config.js');

class QrCommand extends Command {
  constructor() {
    super({
      name: 'qr',
      description: 'Generate a high-quality QR code image from text or URL',
      category: 'Utility',
      aliases: ['qrcode'],
      usage: 'qr <text or url>',
      slashData: new SlashCommandBuilder()
        .setName('qr')
        .setDescription('Generate a QR code')
        .addStringOption(opt => opt.setName('text').setDescription('Text or URL to encode').setRequired(true))
    });
  }

  async execute(ctx, args) {
    const text = ctx.isSlash ? ctx.raw.options.getString('text') : args.join(' ');
    if (!text) return ctx.sendError('Missing Text', 'Please provide text or a URL to generate a QR code for.');

    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=350x350&data=${encodeURIComponent(text)}`;

    const embed = new RotiEmbed()
      .setTitle('📱 Generated QR Code')
      .setDescription(`Encoded: \`${text.slice(0, 100)}\``)
      .setImage(qrUrl)
      .setColor(botConfig.colors.teal);

    return ctx.reply({ embeds: [embed] });
  }
}

module.exports = QrCommand;
