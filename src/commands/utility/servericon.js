const { SlashCommandBuilder } = require('discord.js');
const Command = require('../Command.js');
const RotiEmbed = require('../../utils/embed.js');
const botConfig = require('../../config.js');

class ServericonCommand extends Command {
  constructor() {
    super({
      name: 'servericon',
      description: 'Display the server\'s icon in full resolution',
      category: 'Utility',
      aliases: ['icon'],
      usage: 'servericon',
      slashData: new SlashCommandBuilder()
        .setName('servericon')
        .setDescription('Shows server icon')
    });
  }

  async execute(ctx) {
    const iconUrl = ctx.guild.iconURL({ size: 1024, forceStatic: false });
    if (!iconUrl) return ctx.sendError('No Icon', 'This server has no icon.');

    const embed = new RotiEmbed()
      .setTitle(`🖼️ Icon for ${ctx.guild.name}`)
      .setImage(iconUrl)
      .setDescription(`[Direct Link](${iconUrl})`)
      .setColor(botConfig.colors.teal);

    return ctx.reply({ embeds: [embed] });
  }
}

module.exports = ServericonCommand;
