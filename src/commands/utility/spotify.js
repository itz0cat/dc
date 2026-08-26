const { SlashCommandBuilder, ActivityType } = require('discord.js');
const Command = require('../Command.js');
const RotiEmbed = require('../../utils/embed.js');
const botConfig = require('../../config.js');

class SpotifyCommand extends Command {
  constructor() {
    super({
      name: 'spotify',
      description: 'Inspect what song a member is currently listening to on Spotify',
      category: 'Utility',
      aliases: ['listening', 'sp'],
      usage: 'spotify [user]',
      slashData: new SlashCommandBuilder()
        .setName('spotify')
        .setDescription('View Spotify listening status of a user')
        .addUserOption(opt => opt.setName('user').setDescription('Target user'))
    });
  }

  async execute(ctx, args) {
    const targetUser = ctx.isSlash ? (ctx.raw.options.getUser('user') || ctx.user) : (ctx.raw.mentions.users.first() || ctx.user);
    const member = await ctx.guild.members.fetch(targetUser.id).catch(() => null);

    if (!member) return ctx.sendError('Not Found', 'Member not found.');

    const spotifyActivity = member.presence?.activities?.find(a => a.type === ActivityType.Listening && (a.name === 'Spotify' || a.id === 'spotify:1'));

    if (!spotifyActivity) {
      return ctx.reply({
        embeds: [RotiEmbed.info('Spotify Status', `<@${targetUser.id}> is not currently listening to Spotify or doesn't have Discord rich presence enabled.`)]
      });
    }

    const title = spotifyActivity.details || 'Unknown Title';
    const artist = spotifyActivity.state || 'Unknown Artist';
    const album = spotifyActivity.assets?.largeText || 'Unknown Album';
    const albumArt = spotifyActivity.assets?.largeImageURL() || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=500';
    const syncId = spotifyActivity.syncId;
    const trackUrl = syncId ? `https://open.spotify.com/track/${syncId}` : `https://open.spotify.com/search/${encodeURIComponent(`${title} ${artist}`)}`;

    const embed = new RotiEmbed()
      .setTitle(`🎧 Spotify Activity: ${targetUser.username}`)
      .setDescription(`[**${title}**](${trackUrl})\nby **${artist}**\non *${album}*`)
      .setThumbnail(albumArt)
      .addFields(
        { name: 'Listening Now', value: `<@${targetUser.id}>`, inline: true },
        { name: 'Track Link', value: `[Listen on Spotify](${trackUrl})`, inline: true }
      )
      .setColor(0x1DB954); // Spotify green

    return ctx.reply({ embeds: [embed] });
  }
}

module.exports = SpotifyCommand;
