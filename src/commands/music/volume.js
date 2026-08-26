const { SlashCommandBuilder } = require('discord.js');
const Command = require('../Command.js');
const RotiEmbed = require('../../utils/embed.js');
const botConfig = require('../../config.js');

class VolumeCommand extends Command {
  constructor() {
    super({
      name: 'volume',
      description: 'Adjust or check the music playback volume (1-100%)',
      category: 'Music',
      aliases: ['vol'],
      usage: 'volume [1-100]',
      slashData: new SlashCommandBuilder()
        .setName('volume')
        .setDescription('Set playback volume')
        .addIntegerOption(opt => opt.setName('percent').setDescription('Volume percentage (1-100)').setMinValue(1).setMaxValue(100))
    });
  }

  async execute(ctx, args) {
    const queue = ctx.client.music.getQueue(ctx.guild.id);
    if (!queue) return ctx.sendError('Not Playing', 'No music is currently playing.');

    const newVol = ctx.isSlash ? ctx.raw.options.getInteger('percent') : parseInt(args[0]);

    if (!newVol || isNaN(newVol)) {
      return ctx.reply({ embeds: [RotiEmbed.info('Current Volume', `🔊 Playback volume is currently set to **${queue.volume}%**.`)] });
    }

    if (newVol < 1 || newVol > 100) {
      return ctx.sendError('Invalid Volume', 'Volume must be between 1 and 100%.');
    }

    queue.volume = newVol;
    return ctx.sendSuccess('Volume Updated', `🔊 Volume set to **${newVol}%**!`);
  }
}

module.exports = VolumeCommand;
