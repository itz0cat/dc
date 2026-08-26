const { SlashCommandBuilder } = require('discord.js');
const Command = require('../Command.js');
const RotiEmbed = require('../../utils/embed.js');
const botConfig = require('../../config.js');

class PlayCommand extends Command {
  constructor() {
    super({
      name: 'play',
      description: 'Play a song or playlist from YouTube, Spotify, SoundCloud, or search query',
      category: 'Music',
      aliases: ['p'],
      usage: 'play <song name or URL>',
      slashData: new SlashCommandBuilder()
        .setName('play')
        .setDescription('Play a song in voice channel')
        .addStringOption(opt => opt.setName('query').setDescription('Song title or URL').setRequired(true))
    });
  }

  async execute(ctx, args) {
    const query = ctx.isSlash ? ctx.raw.options.getString('query') : args.join(' ');
    if (!query) return ctx.sendError('Missing Song', 'Please provide a song title or URL.');

    const voiceChannel = ctx.member.voice.channel;
    if (!voiceChannel) {
      return ctx.sendError('Voice Channel Required', 'You must be connected to a voice channel to play music!');
    }

    let queue = ctx.client.music.getQueue(ctx.guild.id);
    if (!queue) {
      queue = ctx.client.music.createQueue(ctx.guild.id, ctx.channel, voiceChannel);
    }

    // Format song metadata
    const song = {
      title: query.startsWith('http') ? 'Stream Audio Track' : query.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
      url: query.startsWith('http') ? query : `https://youtube.com/results?search_query=${encodeURIComponent(query)}`,
      durationStr: '3:30',
      durationMs: 210000,
      thumbnail: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=500',
      requesterId: ctx.user.id
    };

    if (queue.playing) {
      queue.songs.push(song);
      const embed = new RotiEmbed()
        .setTitle('➕ Added to Queue')
        .setDescription(`[**${song.title}**](${song.url})`)
        .addFields(
          { name: 'Position in Queue', value: `#${queue.songs.length}`, inline: true },
          { name: 'Estimated Duration', value: `\`${song.durationStr}\``, inline: true },
          { name: 'Requested by', value: `<@${ctx.user.id}>`, inline: true }
        )
        .setColor(botConfig.colors.teal);
      return ctx.reply({ embeds: [embed] });
    } else {
      await ctx.client.music.play(queue, song);
      if (ctx.isSlash) {
        return ctx.replyEphemeral({ content: `🎶 Started playing **${song.title}** in <#${voiceChannel.id}>!` });
      }
    }
  }
}

module.exports = PlayCommand;
