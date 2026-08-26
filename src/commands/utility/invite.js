const { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const Command = require('../Command.js');
const RotiEmbed = require('../../utils/embed.js');
const botConfig = require('../../config.js');

class InviteCommand extends Command {
  constructor() {
    super({
      name: 'invite',
      description: 'Get an invite link to add R.O.T.I to your Discord server',
      category: 'Utility',
      aliases: ['botinvite', 'addbot'],
      usage: 'invite',
      slashData: new SlashCommandBuilder()
        .setName('invite')
        .setDescription('Invite R.O.T.I to your server')
    });
  }

  async execute(ctx) {
    const inviteUrl = `https://discord.com/oauth2/authorize?client_id=${ctx.client.user.id}&permissions=8&scope=bot%20applications.commands`;

    const embed = new RotiEmbed()
      .setTitle(`✨ Invite ${botConfig.name} to Your Server`)
      .setDescription(`Empower your community with **${botConfig.name}**!\nIncludes Moderation, Ticket Systems, AutoMod, Giveaways, Suggestions, Starboard, Mini-Games, and much more.`)
      .setColor(botConfig.colors.teal);

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setLabel('Invite Bot').setURL(inviteUrl).setStyle(ButtonStyle.Link)
    );

    return ctx.reply({ embeds: [embed], components: [row] });
  }
}

module.exports = InviteCommand;
