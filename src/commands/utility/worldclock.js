const { SlashCommandBuilder } = require('discord.js');
const Command = require('../Command.js');
const RotiEmbed = require('../../utils/embed.js');
const botConfig = require('../../config.js');

class WorldClockCommand extends Command {
  constructor() {
    super({
      name: 'worldclock',
      description: 'Display current local times across major international global timezones',
      category: 'Utility',
      aliases: ['timezones', 'clock', 'time'],
      usage: 'worldclock',
      slashData: new SlashCommandBuilder()
        .setName('worldclock')
        .setDescription('Shows international times and timezones')
    });
  }

  async execute(ctx) {
    const now = new Date();

    const zones = [
      { name: '🌐 Coordinated Universal Time (UTC)', zone: 'UTC' },
      { name: '🇺🇸 New York (EDT/EST)', zone: 'America/New_York' },
      { name: '🇺🇸 Los Angeles (PDT/PST)', zone: 'America/Los_Angeles' },
      { name: '🇬🇧 London (GMT/BST)', zone: 'Europe/London' },
      { name: '🇫🇷 Paris / Berlin (CET)', zone: 'Europe/Paris' },
      { name: '🇯🇵 Tokyo (JST)', zone: 'Asia/Tokyo' },
      { name: '🇦🇺 Sydney (AEST)', zone: 'Australia/Sydney' },
      { name: '🇮🇳 New Delhi (IST)', zone: 'Asia/Kolkata' }
    ];

    const list = zones.map(z => {
      try {
        const timeStr = now.toLocaleTimeString('en-US', { timeZone: z.zone, hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true });
        const dateStr = now.toLocaleDateString('en-US', { timeZone: z.zone, month: 'short', day: 'numeric', weekday: 'short' });
        return `**${z.name}**\n\`${timeStr}\` • ${dateStr}`;
      } catch (e) {
        return `**${z.name}**: \`Error\``;
      }
    }).join('\n\n');

    const embed = new RotiEmbed()
      .setTitle('🌍 World Clock & International Time')
      .setDescription(list)
      .setColor(botConfig.colors.teal);

    return ctx.reply({ embeds: [embed] });
  }
}

module.exports = WorldClockCommand;
