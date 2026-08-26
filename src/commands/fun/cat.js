const { SlashCommandBuilder } = require('discord.js');
const Command = require('../Command.js');
const RotiEmbed = require('../../utils/embed.js');
const botConfig = require('../../config.js');

class CatCommand extends Command {
  constructor() {
    super({
      name: 'cat',
      description: 'Get a cute random cat picture and fun cat fact',
      category: 'Fun',
      aliases: ['kitty', 'meow'],
      usage: 'cat',
      slashData: new SlashCommandBuilder()
        .setName('cat')
        .setDescription('Get a cute cat photo')
    });
  }

  async execute(ctx) {
    await ctx.defer();
    try {
      const res = await fetch('https://api.thecatapi.com/v1/images/search');
      const data = await res.json();
      const imageUrl = data[0]?.url || 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=500';

      const facts = [
        'Cats sleep for 70% of their lives.',
        'A group of cats is called a "clowder".',
        'Cats can jump up to 6 times their height.',
        'A cat\'s purr has a frequency between 25 and 150 Hertz.',
        'Cats have 230 bones, while humans only have 206!'
      ];
      const fact = facts[Math.floor(Math.random() * facts.length)];

      const embed = new RotiEmbed()
        .setTitle('🐱 Meow! Here is a Cat!')
        .setDescription(`💡 **Cat Fact:** ${fact}`)
        .setImage(imageUrl)
        .setColor(botConfig.colors.teal);

      return ctx.reply({ embeds: [embed] });
    } catch (e) {
      return ctx.sendError('Error', 'Could not fetch a cat image.');
    }
  }
}

module.exports = CatCommand;
