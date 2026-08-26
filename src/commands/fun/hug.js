const { SlashCommandBuilder } = require('discord.js');
const Command = require('../Command.js');
const RotiEmbed = require('../../utils/embed.js');
const botConfig = require('../../config.js');

class HugCommand extends Command {
  constructor() {
    super({
      name: 'hug',
      description: 'Give a warm hug to another server member',
      category: 'Fun',
      usage: 'hug <user>',
      slashData: new SlashCommandBuilder()
        .setName('hug')
        .setDescription('Hug a user')
        .addUserOption(opt => opt.setName('user').setDescription('User to hug').setRequired(true))
    });
  }

  async execute(ctx, args) {
    const target = ctx.isSlash ? ctx.raw.options.getUser('user') : ctx.raw.mentions.users.first();
    if (!target) return ctx.sendError('Missing Target', 'Please mention a user to hug.');

    const gifs = [
      'https://media.giphy.com/media/l2QDM9Jnim1YVWL6M/giphy.gif',
      'https://media.giphy.com/media/od5H3PmEG5EVq/giphy.gif',
      'https://media.giphy.com/media/u9BxQbM5bxvwA/giphy.gif'
    ];
    const gif = gifs[Math.floor(Math.random() * gifs.length)];

    const embed = new RotiEmbed()
      .setDescription(`🤗 <@${ctx.user.id}> gave a warm hug to <@${target.id}>!`)
      .setImage(gif)
      .setColor(botConfig.colors.teal);

    return ctx.reply({ embeds: [embed] });
  }
}

module.exports = HugCommand;
