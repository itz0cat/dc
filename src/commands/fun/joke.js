const { SlashCommandBuilder } = require('discord.js');
const Command = require('../Command.js');
const RotiEmbed = require('../../utils/embed.js');
const botConfig = require('../../config.js');

class JokeCommand extends Command {
  constructor() {
    super({
      name: 'joke',
      description: 'Get a funny random joke or pun',
      category: 'Fun',
      aliases: ['dadjoke'],
      usage: 'joke',
      slashData: new SlashCommandBuilder()
        .setName('joke')
        .setDescription('Get a random joke')
    });
  }

  async execute(ctx) {
    await ctx.defer();
    try {
      const res = await fetch('https://official-joke-api.appspot.com/random_joke');
      const data = await res.json();

      const embed = new RotiEmbed()
        .setTitle('😂 Random Joke')
        .setDescription(`**${data.setup}**\n\n*${data.punchline}* 🤣`)
        .setColor(botConfig.colors.teal);

      return ctx.reply({ embeds: [embed] });
    } catch (e) {
      const fallback = [
        { q: 'Why do programmers prefer dark mode?', a: 'Because light attracts bugs!' },
        { q: 'Why did the JavaScript developer wear glasses?', a: 'Because they don\'t C#!' },
        { q: 'What do you call a fake noodle?', a: 'An impasta!' }
      ];
      const item = fallback[Math.floor(Math.random() * fallback.length)];
      return ctx.reply({ embeds: [new RotiEmbed().setTitle('😂 Joke').setDescription(`**${item.q}**\n\n*${item.a}*`).setColor(botConfig.colors.teal)] });
    }
  }
}

module.exports = JokeCommand;
