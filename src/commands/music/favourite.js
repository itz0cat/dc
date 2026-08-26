const { SlashCommandBuilder } = require('discord.js');
const Command = require('../Command.js');
const RotiEmbed = require('../../utils/embed.js');
const botConfig = require('../../config.js');

class FavouriteCommand extends Command {
  constructor() {
    super({
      name: 'like',
      description: 'Save and manage your favorite tracks playlist',
      category: 'Music',
      aliases: ['favourite', 'fav', 'showliked', 'playliked', 'clearliked'],
      usage: 'like [show/play/clear]',
      slashData: new SlashCommandBuilder()
        .setName('like')
        .setDescription('Save song to your favourites')
        .addSubcommand(sub => sub.setName('add').setDescription('Like and save current song'))
        .addSubcommand(sub => sub.setName('show').setDescription('Show your liked songs'))
        .addSubcommand(sub => sub.setName('play').setDescription('Play all your liked songs'))
        .addSubcommand(sub => sub.setName('clear').setDescription('Clear your liked songs list'))
    });
  }

  async execute(ctx, args) {
    const sub = ctx.isSlash ? ctx.raw.options.getSubcommand() : (args[0]?.toLowerCase() || 'add');
    const queue = ctx.client.music.getQueue(ctx.guild.id);

    // Initial table create if not exists
    ctx.client.db.prepare(`
      CREATE TABLE IF NOT EXISTS liked_songs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id TEXT,
        title TEXT,
        url TEXT,
        duration TEXT,
        added_at INTEGER
      )
    `).run();

    if (sub === 'add' || (!ctx.isSlash && args.length === 0)) {
      if (!queue || !queue.current) return ctx.sendError('Not Playing', 'No song is currently playing.');
      const song = queue.current;

      ctx.client.db.prepare(`
        INSERT INTO liked_songs (user_id, title, url, duration, added_at)
        VALUES (?, ?, ?, ?, ?)
      `).run(ctx.user.id, song.title, song.url, song.durationStr, Date.now());

      return ctx.sendSuccess('Liked Track', `💚 Added [**${song.title}**](${song.url}) to your Liked Songs!`);
    }

    if (sub === 'show' || sub === 'showliked') {
      const list = ctx.client.db.prepare('SELECT * FROM liked_songs WHERE user_id = ? ORDER BY added_at DESC LIMIT 15').all(ctx.user.id);
      if (list.length === 0) return ctx.reply({ embeds: [RotiEmbed.info('Liked Songs', 'You do not have any liked songs saved yet. Use `?like` while playing a song!')] });

      const formatted = list.map((s, i) => `**${i + 1}.** [${s.title}](${s.url}) \`[${s.duration || '3:30'}]\``).join('\n');
      const embed = new RotiEmbed()
        .setTitle(`💚 Liked Songs: ${ctx.user.username}`)
        .setDescription(formatted)
        .setColor(0x1DB954);

      return ctx.reply({ embeds: [embed] });
    }

    if (sub === 'clear' || sub === 'clearliked') {
      ctx.client.db.prepare('DELETE FROM liked_songs WHERE user_id = ?').run(ctx.user.id);
      return ctx.sendSuccess('Liked Songs Cleared', '🧹 Removed all songs from your liked songs playlist.');
    }

    if (sub === 'play' || sub === 'playliked') {
      const voiceChannel = ctx.member.voice.channel;
      if (!voiceChannel) return ctx.sendError('Voice Channel Required', 'Join a voice channel first.');

      const list = ctx.client.db.prepare('SELECT * FROM liked_songs WHERE user_id = ?').all(ctx.user.id);
      if (list.length === 0) return ctx.sendError('No Liked Songs', 'You have no saved liked songs.');

      let q = queue || ctx.client.music.createQueue(ctx.guild.id, ctx.channel, voiceChannel);
      for (const s of list) {
        q.songs.push({
          title: s.title,
          url: s.url,
          durationStr: s.duration || '3:30',
          durationMs: 210000,
          thumbnail: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=500',
          source: 'Spotify Liked',
          sourceColor: 0x1DB954,
          requesterId: ctx.user.id
        });
      }

      if (!q.playing) {
        const first = q.songs.shift();
        await ctx.client.music.play(q, first);
      }

      return ctx.sendSuccess('Playing Liked Songs', `🎶 Enqueued **${list.length}** songs from your Favourites!`);
    }
  }
}

module.exports = FavouriteCommand;
