const { SlashCommandBuilder } = require('discord.js');
const Command = require('../Command.js');
const RotiEmbed = require('../../utils/embed.js');
const botConfig = require('../../config.js');

class WeatherCommand extends Command {
  constructor() {
    super({
      name: 'weather',
      description: 'Get current real-time weather and forecast for any city or location',
      category: 'Utility',
      usage: 'weather <city/location>',
      slashData: new SlashCommandBuilder()
        .setName('weather')
        .setDescription('Get live weather information')
        .addStringOption(opt => opt.setName('location').setDescription('City or place name').setRequired(true))
    });
  }

  async execute(ctx, args) {
    const loc = ctx.isSlash ? ctx.raw.options.getString('location') : args.join(' ');
    if (!loc) return ctx.sendError('Missing Location', 'Please provide a city or location name.');

    await ctx.defer();
    try {
      const res = await fetch(`https://wttr.in/${encodeURIComponent(loc)}?format=j1`);
      const data = await res.json();
      const current = data.current_condition[0];
      const area = data.nearest_area[0];

      const city = area.areaName[0].value;
      const country = area.country[0].value;
      const tempC = current.temp_C;
      const tempF = current.temp_F;
      const condition = current.weatherDesc[0].value;
      const humidity = current.humidity;
      const windSpeed = current.windspeedKmph;

      const embed = new RotiEmbed()
        .setTitle(`🌤️ Weather for ${city}, ${country}`)
        .setDescription(`**Condition:** ${condition}\n**Temperature:** ${tempC}°C (${tempF}°F)\n**Humidity:** ${humidity}%\n**Wind:** ${windSpeed} km/h`)
        .setColor(botConfig.colors.teal);

      return ctx.reply({ embeds: [embed] });
    } catch (e) {
      return ctx.sendError('Error', `Could not find weather for \`${loc}\`.`);
    }
  }
}

module.exports = WeatherCommand;
