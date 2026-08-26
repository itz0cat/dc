const { SlashCommandBuilder } = require('discord.js');
const Command = require('../Command.js');
const RotiEmbed = require('../../utils/embed.js');
const botConfig = require('../../config.js');

class BannerCommand extends Command {
  constructor() {
    super({
      name: 'banner',
      description: 'Display a user\'s profile banner',
      category: 'Utility',
      usage: 'banner [user]',
      slashData: new SlashCommandBuilder()
        .setName('banner')
        .setDescription('Shows user banner')
        .addUserOption(opt => opt.setName('user').setDescription('User to view'))
    });
  }

  async execute(ctx, args) {
    const targetUser = ctx.isSlash ? (ctx.raw.options.getUser('user') || ctx.user) : (ctx.raw.mentions.users.first() || ctx.user);
    const userFetched = await ctx.client.users.fetch(targetUser.id, { force: true });

    if (!userFetched.banner) {
      return ctx.sendError('No Banner', `<@${targetUser.id}> does not have a custom profile banner.`);
    }

    const bannerUrl = userFetched.bannerURL({ size: 1024, forceStatic: false });

    const embed = new RotiEmbed()
      .setTitle(`🖼️ Profile Banner for ${targetUser.tag}`)
      .setImage(bannerUrl)
      .setDescription(`[Direct Link](${bannerUrl})`)
      .setColor(botConfig.colors.teal);

    return ctx.reply({ embeds: [embed] });
  }
}

module.exports = BannerCommand;
