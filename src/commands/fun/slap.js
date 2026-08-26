const { SlashCommandBuilder } = require('discord.js');
const Command = require('../Command.js');
const RotiEmbed = require('../../utils/embed.js');
const botConfig = require('../../config.js');

class SlapCommand extends Command {
  constructor() {
    super({
      name: 'slap',
      description: 'Slap another member with an animated GIF embed',
      category: 'Fun',
      usage: 'slap <user>',
      slashData: new SlashCommandBuilder()
        .setName('slap')
        .setDescription('Slap a user')
        .addUserOption(opt => opt.setName('user').setDescription('User to slap').setRequired(true))
    });
  }

  async execute(ctx, args) {
    const target = ctx.isSlash ? ctx.raw.options.getUser('user') : ctx.raw.mentions.users.first();
    if (!target) return ctx.sendError('Missing Target', 'Please mention a user to slap.');

    const gifs = [
      'https://media.giphy.com/media/Gf3AUz3eBNbTW/giphy.gif',
      'https://media.giphy.com/media/jLeyZWgtwWP2U/giphy.gif',
      'https://media.giphy.com/media/mEtSQlxqBtWWA/giphy.gif'
    ];
    const gif = gifs[Math.floor(Math.random() * gifs.length)];

    const embed = new RotiEmbed()
      .setDescription(`💥 <@${ctx.user.id}> slapped <@${target.id}>! Ouch!`)
      .setImage(gif)
      .setColor(botConfig.colors.teal);

    return ctx.reply({ embeds: [embed] });
  }
}

module.exports = SlapCommand;
