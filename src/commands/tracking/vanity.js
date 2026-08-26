const { SlashCommandBuilder } = require('discord.js');
const Command = require('../Command.js');
const RotiEmbed = require('../../utils/embed.js');
const botConfig = require('../../config.js');

class VanityCommand extends Command {
  constructor() {
    super({
      name: 'vanity',
      description: 'Check the server vanity URL invite statistics and uses',
      category: 'Tracking',
      usage: 'vanity',
      slashData: new SlashCommandBuilder()
        .setName('vanity')
        .setDescription('Shows server vanity URL statistics')
    });
  }

  async execute(ctx) {
    const guild = ctx.guild;

    if (!guild.vanityURLCode) {
      return ctx.sendError('No Vanity URL', 'This server does not currently have a custom Vanity URL.');
    }

    const vanityData = await guild.fetchVanityData().catch(() => null);
    const uses = vanityData?.uses || 0;

    const embed = new RotiEmbed()
      .setTitle(`🔗 Vanity URL: .gg/${guild.vanityURLCode}`)
      .setDescription(`**Vanity Invite Code:** \`${guild.vanityURLCode}\`\n**Total Joins via Vanity:** \`${uses.toLocaleString()}\`\n**Full Link:** https://discord.gg/${guild.vanityURLCode}`)
      .setColor(botConfig.colors.teal);

    return ctx.reply({ embeds: [embed] });
  }
}

module.exports = VanityCommand;
