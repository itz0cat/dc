const { SlashCommandBuilder } = require('discord.js');
const Command = require('../Command.js');
const RotiEmbed = require('../../utils/embed.js');
const botConfig = require('../../config.js');

class DogCommand extends Command {
  constructor() {
    super({
      name: 'dog',
      description: 'Get a cute random dog picture',
      category: 'Fun',
      aliases: ['doggo', 'puppy'],
      usage: 'dog',
      slashData: new SlashCommandBuilder()
        .setName('dog')
        .setDescription('Get a cute dog photo')
    });
  }

  async execute(ctx) {
    await ctx.defer();
    try {
      const res = await fetch('https://dog.ceo/api/breeds/image/random');
      const data = await res.json();
      const imageUrl = data.message;

      const embed = new RotiEmbed()
        .setTitle('🐶 Woof! Here is a Dog!')
        .setImage(imageUrl)
        .setColor(botConfig.colors.teal);

      return ctx.reply({ embeds: [embed] });
    } catch (e) {
      return ctx.sendError('Error', 'Could not fetch a dog image.');
    }
  }
}

module.exports = DogCommand;
