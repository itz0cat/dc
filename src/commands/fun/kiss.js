const { SlashCommandBuilder } = require('discord.js');
const Command = require('../Command.js');
const RotiEmbed = require('../../utils/embed.js');
const botConfig = require('../../config.js');

class KissCommand extends Command {
  constructor() {
    super({
      name: 'kiss',
      description: 'Send a sweet kiss to someone special',
      category: 'Fun',
      usage: 'kiss <user>',
      slashData: new SlashCommandBuilder()
        .setName('kiss')
        .setDescription('Kiss a user')
        .addUserOption(opt => opt.setName('user').setDescription('User to kiss').setRequired(true))
    });
  }

  async execute(ctx, args) {
    const target = ctx.isSlash ? ctx.raw.options.getUser('user') : ctx.raw.mentions.users.first();
    if (!target) return ctx.sendError('Missing Target', 'Please mention a user to kiss.');

    const gifs = [
      'https://media.giphy.com/media/FqBTvSNjNzeZG/giphy.gif',
      'https://media.giphy.com/media/G3va31oEEnIkM/giphy.gif',
      'https://media.giphy.com/media/bGm9FuBCGg4SY/giphy.gif'
    ];
    const gif = gifs[Math.floor(Math.random() * gifs.length)];

    const embed = new RotiEmbed()
      .setDescription(`💋 <@${ctx.user.id}> gave a sweet kiss to <@${target.id}>!`)
      .setImage(gif)
      .setColor(botConfig.colors.teal);

    return ctx.reply({ embeds: [embed] });
  }
}

module.exports = KissCommand;
