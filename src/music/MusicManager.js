const { Collection, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const RotiEmbed = require('../utils/embed.js');
const botConfig = require('../config.js');
const { formatDuration } = require('../utils/time.js');
const yts = require('yt-search');

class MusicManager {
  constructor(client) {
    this.client = client;
    this.queues = new Collection();
  }

  getQueue(guildId) {
    return this.queues.get(guildId);
  }

  joinVoice(guild, channelId) {
    try {
      if (guild && guild.shard) {
        guild.shard.send({
          op: 4,
          d: {
            guild_id: guild.id,
            channel_id: channelId,
            self_mute: false,
            self_deaf: false
          }
        });
      }
    } catch (e) {
      this.client.logger.warn(`Failed to send voice state update: ${e.message}`);
    }
  }

  leaveVoice(guild) {
    try {
      if (guild && guild.shard) {
        guild.shard.send({
          op: 4,
          d: {
            guild_id: guild.id,
            channel_id: null,
            self_mute: false,
            self_deaf: false
          }
        });
      }
    } catch (e) {
      this.client.logger.warn(`Failed to send voice leave update: ${e.message}`);
    }
  }

  createQueue(guildId, textChannel, voiceChannel) {
    const existing = this.queues.get(guildId);
    if (existing && existing.timer) clearTimeout(existing.timer);

    this.joinVoice(voiceChannel.guild, voiceChannel.id);

    const queue = {
      guildId,
      textChannel,
      voiceChannel,
      songs: [],
      history: [],
      current: null,
      volume: 80,
      loop: 'off',
      filter: 'none',
      autoplay: false,
      voteskips: new Set(),
      playing: false,
      paused: false,
      startedAt: 0,
      seekOffset: 0,
      timer: null,
      message: null
    };

    this.queues.set(guildId, queue);
    return queue;
  }

  destroyQueue(guildId) {
    const queue = this.queues.get(guildId);
    if (!queue) return;
    if (queue.timer) clearTimeout(queue.timer);

    // Check if 24/7 mode is active
    let is247 = false;
    try {
      const row = this.client.db.prepare('SELECT twenty_four_seven FROM music_guild_configs WHERE guild_id = ?').get(guildId);
      if (row && row.twenty_four_seven) is247 = true;
    } catch (e) {}

    const guild = this.client.guilds.cache.get(guildId);
    if (guild && !is247) {
      this.leaveVoice(guild);
    }

    this.queues.delete(guildId);
  }

  getMusicButtons(isPaused = false) {
    const row1 = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('music_pause')
        .setLabel(isPaused ? 'Resume' : 'Pause')
        .setStyle(ButtonStyle.Secondary)
        .setEmoji(isPaused ? '▶️' : '⏸️'),
      new ButtonBuilder()
        .setCustomId('music_skip')
        .setLabel('Skip')
        .setStyle(ButtonStyle.Secondary)
        .setEmoji('⏭️'),
      new ButtonBuilder()
        .setCustomId('music_shuffle')
        .setLabel('Shuffle')
        .setStyle(ButtonStyle.Secondary)
        .setEmoji('🔀')
    );

    const row2 = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('music_stop')
        .setLabel('Stop')
        .setStyle(ButtonStyle.Danger)
        .setEmoji('⏹️'),
      new ButtonBuilder()
        .setCustomId('music_like')
        .setLabel('Like')
        .setStyle(ButtonStyle.Success)
        .setEmoji('💚')
    );

    return [row1, row2];
  }

  async play(queue, song) {
    if (queue.timer) clearTimeout(queue.timer);

    if (queue.current) {
      queue.history.push(queue.current);
    }

    queue.current = song;
    queue.startedAt = Date.now();
    queue.seekOffset = 0;
    queue.playing = true;
    queue.paused = false;
    queue.voteskips.clear();

    if (queue.voiceChannel) {
      this.joinVoice(queue.voiceChannel.guild, queue.voiceChannel.id);
    }

    const durationMs = song.durationMs || 210000;

    const embed = new RotiEmbed()
      .setAuthor({ name: `${song.source || 'Spotify'} Now Playing`, iconURL: song.sourceIconUrl || 'https://cdn-icons-png.flaticon.com/512/174/174872.png' })
      .setDescription(
        `• [**${song.title}**](${song.url})\n` +
        `• **Duration:** \`${song.durationStr || formatDuration(durationMs)}\` - (<@${song.requesterId}>)`
      )
      .setThumbnail(song.thumbnail || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=500')
      .setColor(song.sourceColor || 0x1DB954);

    const components = this.getMusicButtons(false);
    queue.message = await queue.textChannel.send({ embeds: [embed], components }).catch(() => null);

    queue.timer = setTimeout(() => {
      this.handleSongEnd(queue.guildId);
    }, durationMs);
  }

  async handleSongEnd(guildId) {
    const queue = this.queues.get(guildId);
    if (!queue) return;

    if (queue.loop === 'track' && queue.current) {
      return this.play(queue, queue.current);
    }

    if (queue.loop === 'queue' && queue.current) {
      queue.songs.push(queue.current);
    }

    if (queue.songs.length > 0) {
      const nextSong = queue.songs.shift();
      return this.play(queue, nextSong);
    }

    // Check if autoplay is enabled
    if (queue.autoplay && queue.current) {
      try {
        const query = `${queue.current.artist || ''} song recommendation`;
        const res = await yts(query);
        if (res && res.videos && res.videos.length > 1) {
          const autoVideo = res.videos[1];
          const mins = Math.floor((autoVideo.seconds || 210) / 60);
          const secs = (autoVideo.seconds || 210) % 60;
          const autoSong = {
            title: autoVideo.title,
            url: autoVideo.url,
            artist: autoVideo.author?.name || 'Artist',
            artistUrl: autoVideo.author?.url || autoVideo.url,
            durationStr: `${String(mins).padStart(2, '0')}m ${String(secs).padStart(2, '0')}s`,
            durationMs: (autoVideo.seconds || 210) * 1000,
            views: autoVideo.views ? autoVideo.views.toLocaleString() : 'N/A',
            thumbnail: autoVideo.thumbnail || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=500',
            source: 'Spotify Autoplay',
            sourceIconUrl: 'https://cdn-icons-png.flaticon.com/512/174/174872.png',
            sourceColor: 0x1DB954,
            requesterId: this.client.user.id
          };
          return this.play(queue, autoSong);
        }
      } catch (e) {}
    }

    queue.playing = false;
    queue.current = null;
    const finishedEmbed = new RotiEmbed()
      .setTitle('Queue Concluded')
      .setDescription('No more songs remaining in the queue.')
      .setColor(botConfig.colors.teal);
    queue.textChannel.send({ embeds: [finishedEmbed] }).catch(() => {});
    this.destroyQueue(guildId);
  }

  getProgressBar(currentMs, totalMs, length = 14) {
    if (!totalMs || totalMs <= 0) totalMs = 225000;
    const progress = Math.min(1, Math.max(0, currentMs / totalMs));
    const filled = Math.round(progress * length);
    const empty = Math.max(0, length - filled);
    return '▬'.repeat(filled) + '🔘' + '▬'.repeat(empty);
  }
}

module.exports = MusicManager;
