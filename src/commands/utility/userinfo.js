const { SlashCommandBuilder } = require('discord.js');
const Command = require('../Command.js');
const RotiEmbed = require('../../utils/embed.js');
const botConfig = require('../../config.js');

class UserinfoCommand extends Command {
  constructor() {
    super({
      name: 'userinfo',
      description: 'Display detailed account & server profile information for a user',
      category: 'Utility',
      aliases: ['ui', 'whois'],
      usage: 'userinfo [user]',
      slashData: new SlashCommandBuilder()
        .setName('userinfo')
        .setDescription('Shows user information')
        .addUserOption(opt => opt.setName('user').setDescription('Target user'))
    });
  }

  async execute(ctx, args) {
    const targetUser = ctx.isSlash ? (ctx.raw.options.getUser('user') || ctx.user) : (ctx.raw.mentions.users.first() || ctx.user);
    const member = await ctx.guild.members.fetch(targetUser.id).catch(() => null);

    const embed = new RotiEmbed()
      .setTitle(`👤 User Info: ${targetUser.tag}`)
      .setThumbnail(targetUser.displayAvatarURL({ forceStatic: false }))
      .addFields(
        { name: 'Username', value: `${targetUser.username}`, inline: true },
        { name: 'User ID', value: `\`${targetUser.id}\``, inline: true },
        { name: 'Bot Account', value: targetUser.bot ? 'Yes' : 'No', inline: true },
        { name: 'Account Created', value: `<t:${Math.floor(targetUser.createdTimestamp / 1000)}:R>`, inline: true }
      )
      .setColor(botConfig.colors.teal);

    if (member) {
      const roles = member.roles.cache.filter(r => r.id !== ctx.guild.id).map(r => `<@&${r.id}>`).slice(0, 15).join(', ') || '*None*';
      embed.addFields(
        { name: 'Joined Server', value: `<t:${Math.floor(member.joinedTimestamp / 1000)}:R>`, inline: true },
        { name: 'Nickname', value: member.nickname || '*None*', inline: true },
        { name: `Roles (${member.roles.cache.size - 1})`, value: roles, inline: false }
      );
    }

    return ctx.reply({ embeds: [embed] });
  }
}

module.exports = UserinfoCommand;
