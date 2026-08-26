const { SlashCommandBuilder, ChannelType } = require('discord.js');
const Command = require('../Command.js');
const RotiEmbed = require('../../utils/embed.js');
const botConfig = require('../../config.js');

class ServerinfoCommand extends Command {
  constructor() {
    super({
      name: 'serverinfo',
      description: 'Display comprehensive server details, stats, channels, and roles',
      category: 'Utility',
      aliases: ['guildinfo', 'si'],
      usage: 'serverinfo',
      slashData: new SlashCommandBuilder()
        .setName('serverinfo')
        .setDescription('Shows server information')
    });
  }

  async execute(ctx) {
    const guild = ctx.guild;
    const owner = await guild.fetchOwner();
    const channels = guild.channels.cache;
    const textChannels = channels.filter(c => c.type === ChannelType.GuildText).size;
    const voiceChannels = channels.filter(c => c.type === ChannelType.GuildVoice).size;
    const categories = channels.filter(c => c.type === ChannelType.GuildCategory).size;

    const embed = new RotiEmbed()
      .setTitle(`🏰 Server Information: ${guild.name}`)
      .setThumbnail(guild.iconURL({ forceStatic: false }))
      .addFields(
        { name: 'Owner', value: `<@${owner.id}> (${owner.user.tag})`, inline: true },
        { name: 'Server ID', value: `\`${guild.id}\``, inline: true },
        { name: 'Created', value: `<t:${Math.floor(guild.createdTimestamp / 1000)}:R>`, inline: true },
        { name: 'Members', value: `👥 **${guild.memberCount}** members`, inline: true },
        { name: 'Channels', value: `💬 ${textChannels} text | 🔊 ${voiceChannels} voice | 📁 ${categories} categories`, inline: true },
        { name: 'Roles', value: `🎭 **${guild.roles.cache.size}** roles`, inline: true },
        { name: 'Boost Level', value: `🚀 Level ${guild.premiumTier} (${guild.premiumSubscriptionCount || 0} boosts)`, inline: true },
        { name: 'Verification Level', value: `${guild.verificationLevel}`, inline: true }
      )
      .setColor(botConfig.colors.teal);

    if (guild.bannerURL()) {
      embed.setImage(guild.bannerURL({ size: 1024 }));
    }

    return ctx.reply({ embeds: [embed] });
  }
}

module.exports = ServerinfoCommand;
