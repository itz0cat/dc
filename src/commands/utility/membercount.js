const { SlashCommandBuilder } = require('discord.js');
const Command = require('../Command.js');
const RotiEmbed = require('../../utils/embed.js');
const botConfig = require('../../config.js');

class MembercountCommand extends Command {
  constructor() {
    super({
      name: 'membercount',
      description: 'Shows total member count breakdown of the server',
      category: 'Utility',
      aliases: ['members', 'mc'],
      usage: 'membercount',
      slashData: new SlashCommandBuilder()
        .setName('membercount')
        .setDescription('Shows total member count of server')
    });
  }

  async execute(ctx) {
    const guild = ctx.guild;
    const total = guild.memberCount;
    const bots = guild.members.cache.filter(m => m.user.bot).size;
    const humans = total - bots;

    const embed = new RotiEmbed()
      .setTitle(`👥 Member Count: ${guild.name}`)
      .addFields(
        { name: 'Total Members', value: `\`${total}\``, inline: true },
        { name: 'Humans', value: `\`${humans}\``, inline: true },
        { name: 'Bots', value: `\`${bots}\``, inline: true }
      )
      .setColor(botConfig.colors.teal);

    return ctx.reply({ embeds: [embed] });
  }
}

module.exports = MembercountCommand;
