const { SlashCommandBuilder } = require('discord.js');
const Command = require('../Command.js');
const RotiEmbed = require('../../utils/embed.js');
const botConfig = require('../../config.js');

class CuddleCommand extends Command {
  constructor() {
    super({
      name: 'cuddle',
      description: 'Cuddle with another member',
      category: 'Fun',
      usage: 'cuddle <user>',
      slashData: new SlashCommandBuilder()
        .setName('cuddle')
        .setDescription('Cuddle a user')
        .addUserOption(opt => opt.setName('user').setDescription('User to cuddle').setRequired(true))
    });
  }

  async execute(ctx, args) {
    const target = ctx.isSlash ? ctx.raw.options.getUser('user') : ctx.raw.mentions.users.first();
    if (!target) return ctx.sendError('Missing Target', 'Please mention a user to cuddle.');

    const gifs = [
      'https://media.giphy.com/media/lrr9rHuoJOE0w/giphy.gif',
      'https://media.giphy.com/media/3bqtLDeiDtwhq/giphy.gif'
    ];
    const gif = gifs[Math.floor(Math.random() * gifs.length)];

    const embed = new RotiEmbed()
      .setDescription(`🥰 <@${ctx.user.id}> is cuddling <@${target.id}>! So cozy!`)
      .setImage(gif)
      .setColor(botConfig.colors.teal);

    return ctx.reply({ embeds: [embed] });
  }
}

module.exports = CuddleCommand;
