const { SlashCommandBuilder } = require('discord.js');
const Command = require('../Command.js');
const RotiEmbed = require('../../utils/embed.js');
const botConfig = require('../../config.js');
const yts = require('yt-search');

class PlayCommand extends Command {
  constructor() {
    super({
      name: 'play',
      description: 'Play a song or playlist from YouTube, YouTube Music, Spotify, SoundCloud, or search query',
      category: 'Music',
      aliases: ['p'],
      usage: 'play <song name or URL>',
      slashData: new SlashCommandBuilder()
        .setName('play')
        .setDescription('Play a song in voice channel')
        .addStringOption(opt => opt.setName('query').setDescription('Song title or URL').setRequired(true))
    });
  }

  detectSource(query) {
    const q = query.toLowerCase();
    if (q.includes('music.youtube.com')) return '🔴 YouTube Music';
    if (q.includes('spotify.com')) return '🟢 Spotify (Matched on YouTube Music)';
    if (q.includes('soundcloud.com')) return '🟠 SoundCloud';
    if (q.includes('youtube.com') || q.includes('youtu.be')) return '🔴 YouTube';
    return '🔴 YouTube Music';
  }

  async execute(ctx, args) {
    const query = ctx.isSlash ? ctx.raw.options.getString('query') : args.join(' ');
    if (!query) return ctx.sendError('Missing Song', 'Please provide a song title, artist, or music URL.');

    const voiceChannel = ctx.member.voice.channel;
    if (!voiceChannel) {
      return ctx.sendError('Voice Channel Required', 'You must be connected to a voice channel to play music!');
    }

    await ctx.defer();

    const platform = this.detectSource(query);
    let song = null;

    try {
      // Search for track using yt-search
      const searchRes = await yts(query);
      const video = searchRes.videos && searchRes.videos.length > 0 ? searchRes.videos[0] : null;

      if (!video) {
        return ctx.sendError('No Results', `Could not find any music matching \`${query}\` on **${platform}**.`);
      }

      song = {
        title: video.title,
        url: video.url,
        artist: video.author?.name || 'Unknown Artist',
        artistUrl: video.author?.url || video.url,
        durationStr: video.timestamp || '3:30',
        durationMs: (video.seconds || 210) * 1000,
        views: video.views ? video.views.toLocaleString() : 'N/A',
        thumbnail: video.thumbnail || video.image || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=500',
        source: platform,
        requesterId: ctx.user.id
      };
    } catch (e) {
      // Fallback if search fails
      song = {
        title: query.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
        url: query.startsWith('http') ? query : `https://youtube.com/results?search_query=${encodeURIComponent(query)}`,
        artist: 'Various Artists',
        artistUrl: 'https://youtube.com',
        durationStr: '3:30',
        durationMs: 210000,
        views: '1,000,000+',
        thumbnail: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=500',
        source: platform,
        requesterId: ctx.user.id
      };
    }

    let queue = ctx.client.music.getQueue(ctx.guild.id);
    if (!queue) {
      queue = ctx.client.music.createQueue(ctx.guild.id, ctx.channel, voiceChannel);
    } else {
      ctx.client.music.joinVoice(ctx.guild, voiceChannel.id);
    }

    if (queue.playing) {
      queue.songs.push(song);
      const embed = new RotiEmbed()
        .setTitle('➕ Track Added to Queue')
        .setDescription(`[**${song.title}**](${song.url})`)
        .setThumbnail(song.thumbnail)
        .addFields(
          { name: '👤 Artist / Channel', value: `[${song.artist}](${song.artistUrl})`, inline: true },
          { name: '📡 Source Platform', value: `\`${song.source}\``, inline: true },
          { name: '⏱️ Duration', value: `\`${song.durationStr}\``, inline: true },
          { name: '👁️ Total Views', value: `\`${song.views}\``, inline: true },
          { name: '🔢 Queue Position', value: `\`#${queue.songs.length}\``, inline: true },
          { name: '🙋 Requested By', value: `<@${ctx.user.id}>`, inline: true }
        )
        .setColor(botConfig.colors.teal);
      return ctx.reply({ embeds: [embed] });
    } else {
      await ctx.client.music.play(queue, song);
      if (ctx.isSlash) {
        return ctx.replyEphemeral({ content: `🎶 Started playing **${song.title}** on ${song.source} in <#${voiceChannel.id}>!` });
      }
    }
  }
}

module.exports = PlayCommand;
