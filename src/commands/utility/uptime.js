const { SlashCommandBuilder } = require('discord.js');
const Command = require('../Command.js');
const RotiEmbed = require('../../utils/embed.js');
const botConfig = require('../../config.js');
const { formatDuration } = require('../../utils/time.js');

class UptimeCommand extends Command {
  constructor() {
    super({
      name: 'uptime',
      description: 'Check how long R.O.T.I has been continuously online',
      category: 'Utility',
      usage: 'uptime',
      slashData: new SlashCommandBuilder()
        .setName('uptime')
        .setDescription('Shows bot uptime')
    });
  }

  async execute(ctx) {
    const uptime = formatDuration(process.uptime() * 1000);
    const onlineSince = new Date(Date.now() - (process.uptime() * 1000));

    const embed = new RotiEmbed()
      .setTitle('⏱️ Bot Uptime')
      .setDescription(`**${botConfig.name}** has been online for:\n# \`${uptime}\`\n\nOnline since: <t:${Math.floor(onlineSince.getTime() / 1000)}:F> (<t:${Math.floor(onlineSince.getTime() / 1000)}:R>)`)
      .setColor(botConfig.colors.teal);

    return ctx.reply({ embeds: [embed] });
  }
}

module.exports = UptimeCommand;
