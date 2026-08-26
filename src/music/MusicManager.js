const { Collection, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const RotiEmbed = require('../utils/embed.js');
const botConfig = require('../config.js');
const { formatDuration } = require('../utils/time.js');

class MusicManager {
  constructor(client) {
    this.client = client;
    this.queues = new Collection(); // GuildId -> Queue Object
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
            self_deaf: false // NOT deafened
          }
        });
      }
    } catch (e) {
      this.client.logger.warn(`Failed to send Voice State Update: ${e.message}`);
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
    } catch (e) {}
  }

  createQueue(guildId, textChannel, voiceChannel) {
    this.joinVoice(voiceChannel.guild, voiceChannel.id);

    const queue = {
      guildId,
      textChannel,
      voiceChannel,
      songs: [],
      current: null,
      volume: 80,
      loop: 'off', // 'off', 'track', 'queue'
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
    
    const guild = this.client.guilds.cache.get(guildId);
    if (guild) {
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

    queue.current = song;
    queue.startedAt = Date.now();
    queue.seekOffset = 0;
    queue.playing = true;
    queue.paused = false;

    // Ensure bot is in voice channel
    if (queue.voiceChannel) {
      this.joinVoice(queue.voiceChannel.guild, queue.voiceChannel.id);
    }

    const embed = new RotiEmbed()
      .setAuthor({ name: `${song.source || 'Spotify'} Now Playing`, iconURL: song.sourceIconUrl || 'https://cdn-icons-png.flaticon.com/512/174/174872.png' })
      .setDescription(
        `• [**${song.title}**](${song.url})\n` +
        `• **Duration:** \`${song.durationStr || '03m 53s'}\` - (<@${song.requesterId}>)`
      )
      .setThumbnail(song.thumbnail || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=500')
      .setColor(song.sourceColor || 0x1DB954);

    const components = this.getMusicButtons(false);
    queue.message = await queue.textChannel.send({ embeds: [embed], components }).catch(() => null);

    // Schedule next song when duration expires
    const durationMs = song.durationMs || 210000;
    queue.timer = setTimeout(() => {
      this.handleSongEnd(queue.guildId);
    }, durationMs);
  }

  handleSongEnd(guildId) {
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
    } else {
      queue.playing = false;
      queue.current = null;
      const finishedEmbed = new RotiEmbed()
        .setTitle('🎵 Queue Concluded')
        .setDescription('No more songs remaining in the queue. Leaving voice channel.')
        .setColor(botConfig.colors.teal);
      queue.textChannel.send({ embeds: [finishedEmbed] }).catch(() => {});
      this.destroyQueue(guildId);
    }
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
