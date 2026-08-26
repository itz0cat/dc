const { SlashCommandBuilder, version: djsVersion } = require('discord.js');
const Command = require('../Command.js');
const RotiEmbed = require('../../utils/embed.js');
const botConfig = require('../../config.js');
const { formatDuration } = require('../../utils/time.js');
const os = require('os');

class StatsCommand extends Command {
  constructor() {
    super({
      name: 'stats',
      description: 'Display bot system performance, memory usage, and runtime metrics',
      category: 'Utility',
      aliases: ['botinfo', 'info'],
      usage: 'stats',
      slashData: new SlashCommandBuilder()
        .setName('stats')
        .setDescription('Shows bot statistics and system information')
    });
  }

  async execute(ctx) {
    const memory = process.memoryUsage();
    const usedMb = (memory.heapUsed / 1024 / 1024).toFixed(2);
    const totalMb = (os.totalmem() / 1024 / 1024 / 1024).toFixed(2);
    const uptime = formatDuration(process.uptime() * 1000);

    const embed = new RotiEmbed()
      .setTitle(`📊 ${botConfig.name} System Statistics`)
      .setThumbnail(ctx.client.user.displayAvatarURL())
      .addFields(
        { name: 'Creator', value: `\`${botConfig.creator}\``, inline: true },
        { name: 'Bot Version', value: `\`v${botConfig.version}\``, inline: true },
        { name: 'Discord.js', value: `\`v${djsVersion}\``, inline: true },
        { name: 'Node.js', value: `\`${process.version}\``, inline: true },
        { name: 'Servers', value: `\`${ctx.client.guilds.cache.size}\``, inline: true },
        { name: 'Users', value: `\`${ctx.client.users.cache.size}\``, inline: true },
        { name: 'Uptime', value: `\`${uptime}\``, inline: true },
        { name: 'RAM Usage', value: `\`${usedMb} MB\``, inline: true },
        { name: 'Host OS', value: `\`${os.type()} ${os.arch()}\``, inline: true }
      )
      .setColor(botConfig.colors.teal);

    return ctx.reply({ embeds: [embed] });
  }
}

module.exports = StatsCommand;
