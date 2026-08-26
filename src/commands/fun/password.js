const { SlashCommandBuilder } = require('discord.js');
const Command = require('../Command.js');
const RotiEmbed = require('../../utils/embed.js');
const botConfig = require('../../config.js');
const crypto = require('crypto');

class PasswordCommand extends Command {
  constructor() {
    super({
      name: 'password',
      description: 'Generates a strong, secure random password',
      category: 'Fun',
      aliases: ['genpass'],
      usage: 'password [length]',
      slashData: new SlashCommandBuilder()
        .setName('password')
        .setDescription('Generate a strong secure password')
        .addIntegerOption(opt => opt.setName('length').setDescription('Password length (8-64, default: 16)').setMinValue(8).setMaxValue(64))
    });
  }

  async execute(ctx, args) {
    const length = ctx.isSlash ? (ctx.raw.options.getInteger('length') || 16) : (parseInt(args[0]) || 16);
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+-=';
    
    let pass = '';
    const bytes = crypto.randomBytes(length);
    for (let i = 0; i < length; i++) {
      pass += chars[bytes[i] % chars.length];
    }

    const embed = new RotiEmbed()
      .setTitle('🔐 Secure Generated Password')
      .setDescription(`\`\`\`${pass}\`\`\`\n**Length:** \`${length}\` characters\n*Keep your passwords secret and never share them with anyone!*`)
      .setColor(botConfig.colors.teal);

    return ctx.replyEphemeral({ embeds: [embed] });
  }
}

module.exports = PasswordCommand;
