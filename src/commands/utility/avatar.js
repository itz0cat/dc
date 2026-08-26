const { SlashCommandBuilder } = require('discord.js');
const Command = require('../Command.js');
const RotiEmbed = require('../../utils/embed.js');
const botConfig = require('../../config.js');

class AvatarCommand extends Command {
  constructor() {
    super({
      name: 'avatar',
      description: 'Display a user\'s global or server avatar in high definition',
      category: 'Utility',
      aliases: ['av', 'pfp'],
      usage: 'avatar [user]',
      slashData: new SlashCommandBuilder()
        .setName('avatar')
        .setDescription('Shows a user avatar')
        .addUserOption(opt => opt.setName('user').setDescription('User to view'))
    });
  }

  async execute(ctx, args) {
    const targetUser = ctx.isSlash ? (ctx.raw.options.getUser('user') || ctx.user) : (ctx.raw.mentions.users.first() || ctx.user);
    const avatarUrl = targetUser.displayAvatarURL({ size: 1024, forceStatic: false });

    const embed = new RotiEmbed()
      .setTitle(`🖼️ Avatar for ${targetUser.tag}`)
      .setImage(avatarUrl)
      .setDescription(`[PNG](${targetUser.displayAvatarURL({ extension: 'png', size: 1024 })}) | [JPG](${targetUser.displayAvatarURL({ extension: 'jpg', size: 1024 })}) | [WEBP](${targetUser.displayAvatarURL({ extension: 'webp', size: 1024 })})`)
      .setColor(botConfig.colors.teal);

    return ctx.reply({ embeds: [embed] });
  }
}

module.exports = AvatarCommand;
