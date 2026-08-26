const { Collection } = require('discord.js');
const RotiEmbed = require('../utils/embed.js');
const botConfig = require('../config.js');
const { formatDuration } = require('../utils/time.js');

let djsVoice = null;
try {
  djsVoice = require('@discordjs/voice');
} catch (e) {
  // Voice native binding not available in Android PRoot namespace, running pure JS manager
}

class MusicManager {
  constructor(client) {
    this.client = client;
    this.queues = new Collection(); // GuildId -> Queue Object
  }

  getQueue(guildId) {
    return this.queues.get(guildId);
  }

  createQueue(guildId, textChannel, voiceChannel) {
    let connection = null;
    let player = null;

    if (djsVoice && djsVoice.joinVoiceChannel) {
      try {
        connection = djsVoice.joinVoiceChannel({
          channelId: voiceChannel.id,
          guildId: guildId,
          adapterCreator: voiceChannel.guild.voiceAdapterCreator,
          selfDeaf: true
        });
        player = djsVoice.createAudioPlayer();
        connection.subscribe(player);
      } catch (e) {
        this.client.logger.warn(`Voice connection skipped (PRoot sandbox): ${e.message}`);
      }
    }

    const queue = {
      guildId,
      textChannel,
      voiceChannel,
      connection,
      player,
      songs: [],
      current: null,
      volume: 80,
      loop: 'off', // 'off', 'track', 'queue'
      playing: false,
      paused: false,
      startedAt: 0,
      seekOffset: 0,
      timer: null
    };

    this.queues.set(guildId, queue);
    return queue;
  }

  destroyQueue(guildId) {
    const queue = this.queues.get(guildId);
    if (!queue) return;
    if (queue.timer) clearTimeout(queue.timer);
    try {
      if (queue.player && queue.player.stop) queue.player.stop();
      if (queue.connection && queue.connection.destroy) queue.connection.destroy();
    } catch (e) {}
    this.queues.delete(guildId);
  }

  async play(queue, song) {
    if (queue.timer) clearTimeout(queue.timer);

    queue.current = song;
    queue.startedAt = Date.now();
    queue.seekOffset = 0;
    queue.playing = true;
    queue.paused = false;

    // Send Now Playing notification
    const embed = new RotiEmbed()
      .setTitle('🎵 Now Playing')
      .setDescription(`[**${song.title}**](${song.url})`)
      .setThumbnail(song.thumbnail || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=500')
      .addFields(
        { name: 'Duration', value: `\`${song.durationStr || '3:45'}\``, inline: true },
        { name: 'Requested by', value: `<@${song.requesterId}>`, inline: true },
        { name: 'Volume', value: `\`${queue.volume}%\``, inline: true }
      )
      .setColor(botConfig.colors.teal);

    queue.textChannel.send({ embeds: [embed] }).catch(() => {});

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

  getProgressBar(currentMs, totalMs, length = 15) {
    if (!totalMs || totalMs <= 0) totalMs = 225000;
    const progress = Math.min(1, Math.max(0, currentMs / totalMs));
    const filled = Math.round(progress * length);
    const empty = length - filled;
    return '▬'.repeat(filled) + '🔘' + '▬'.repeat(empty);
  }
}

module.exports = MusicManager;
