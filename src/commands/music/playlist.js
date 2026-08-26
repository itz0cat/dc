const { SlashCommandBuilder } = require('discord.js');
const Command = require('../Command.js');
const RotiEmbed = require('../../utils/embed.js');
const botConfig = require('../../config.js');

class PlaylistCommand extends Command {
  constructor() {
    super({
      name: 'playlist',
      description: 'Create and manage custom server or personal music playlists',
      category: 'Music',
      aliases: ['pl', 'customplaylist'],
      usage: 'playlist <create/add/remove/list/view/play/delete/savequeue> [name]',
      slashData: new SlashCommandBuilder()
        .setName('playlist')
        .setDescription('Manage custom music playlists')
        .addSubcommand(sub => sub.setName('create').setDescription('Create a new playlist').addStringOption(o => o.setName('name').setDescription('Playlist name').setRequired(true)))
        .addSubcommand(sub => sub.setName('list').setDescription('List your saved playlists'))
        .addSubcommand(sub => sub.setName('view').setDescription('View tracks inside a playlist').addStringOption(o => o.setName('name').setDescription('Playlist name').setRequired(true)))
        .addSubcommand(sub => sub.setName('play').setDescription('Play a saved playlist').addStringOption(o => o.setName('name').setDescription('Playlist name').setRequired(true)))
        .addSubcommand(sub => sub.setName('delete').setDescription('Delete a playlist').addStringOption(o => o.setName('name').setDescription('Playlist name').setRequired(true)))
        .addSubcommand(sub => sub.setName('savequeue').setDescription('Save current playing queue as a playlist').addStringOption(o => o.setName('name').setDescription('Playlist name').setRequired(true)))
    });
  }

  async execute(ctx, args) {
    const sub = ctx.isSlash ? ctx.raw.options.getSubcommand() : (args[0]?.toLowerCase() || 'list');
    const plName = ctx.isSlash ? ctx.raw.options.getString('name') : args.slice(1).join(' ');

    ctx.client.db.prepare(`
      CREATE TABLE IF NOT EXISTS user_playlists (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id TEXT,
        name TEXT,
        tracks TEXT,
        created_at INTEGER
      )
    `).run();

    if (sub === 'create') {
      if (!plName) return ctx.sendError('Missing Name', 'Provide a name for the playlist, e.g. `?playlist create ChillVibes`.');
      const existing = ctx.client.db.prepare('SELECT id FROM user_playlists WHERE user_id = ? AND LOWER(name) = LOWER(?)').get(ctx.user.id, plName);
      if (existing) return ctx.sendError('Duplicate Playlist', `You already have a playlist named \`${plName}\`.`);

      ctx.client.db.prepare('INSERT INTO user_playlists (user_id, name, tracks, created_at) VALUES (?, ?, ?, ?)').run(ctx.user.id, plName, JSON.stringify([]), Date.now());
      return ctx.sendSuccess('Playlist Created', `📁 Created playlist **${plName}**! Add tracks with \`?playlist addtrack ${plName} <song>\`.`);
    }

    if (sub === 'list') {
      const lists = ctx.client.db.prepare('SELECT * FROM user_playlists WHERE user_id = ?').all(ctx.user.id);
      if (lists.length === 0) return ctx.reply({ embeds: [RotiEmbed.info('Playlists', 'You have no saved playlists. Create one with `?playlist create <name>`!')] });

      const listStr = lists.map((p, i) => {
        const tracks = JSON.parse(p.tracks || '[]');
        return `**${i + 1}.** 📁 **${p.name}** — \`${tracks.length} tracks\``;
      }).join('\n');

      const embed = new RotiEmbed()
        .setTitle(`🎶 Playlists: ${ctx.user.username}`)
        .setDescription(listStr)
        .setColor(botConfig.colors.teal);
      return ctx.reply({ embeds: [embed] });
    }

    if (sub === 'view') {
      if (!plName) return ctx.sendError('Missing Name', 'Provide a playlist name to view.');
      const pl = ctx.client.db.prepare('SELECT * FROM user_playlists WHERE user_id = ? AND LOWER(name) = LOWER(?)').get(ctx.user.id, plName);
      if (!pl) return ctx.sendError('Not Found', `Playlist \`${plName}\` does not exist.`);

      const tracks = JSON.parse(pl.tracks || '[]');
      if (tracks.length === 0) return ctx.reply({ embeds: [RotiEmbed.info(pl.name, 'This playlist has no songs yet.')] });

      const formatted = tracks.slice(0, 15).map((t, i) => `**${i + 1}.** [${t.title}](${t.url}) \`[${t.duration || '3:30'}]\``).join('\n');
      const embed = new RotiEmbed()
        .setTitle(`📁 Playlist: ${pl.name} (${tracks.length} tracks)`)
        .setDescription(formatted)
        .setColor(botConfig.colors.teal);
      return ctx.reply({ embeds: [embed] });
    }

    if (sub === 'savequeue') {
      if (!plName) return ctx.sendError('Missing Name', 'Provide a name for the new playlist.');
      const queue = ctx.client.music.getQueue(ctx.guild.id);
      if (!queue || (!queue.current && queue.songs.length === 0)) return ctx.sendError('No Queue', 'No active queue to save.');

      const allSongs = [];
      if (queue.current) allSongs.push({ title: queue.current.title, url: queue.current.url, duration: queue.current.durationStr });
      queue.songs.forEach(s => allSongs.push({ title: s.title, url: s.url, duration: s.durationStr }));

      ctx.client.db.prepare('INSERT INTO user_playlists (user_id, name, tracks, created_at) VALUES (?, ?, ?, ?)').run(ctx.user.id, plName, JSON.stringify(allSongs), Date.now());
      return ctx.sendSuccess('Queue Saved', `💾 Saved **${allSongs.length}** songs into playlist **${plName}**!`);
    }

    if (sub === 'play') {
      if (!plName) return ctx.sendError('Missing Name', 'Specify which playlist to play.');
      const voiceChannel = ctx.member.voice.channel;
      if (!voiceChannel) return ctx.sendError('Voice Channel Required', 'Connect to a voice channel first.');

      const pl = ctx.client.db.prepare('SELECT * FROM user_playlists WHERE user_id = ? AND LOWER(name) = LOWER(?)').get(ctx.user.id, plName);
      if (!pl) return ctx.sendError('Not Found', `Playlist \`${plName}\` not found.`);

      const tracks = JSON.parse(pl.tracks || '[]');
      if (tracks.length === 0) return ctx.sendError('Empty Playlist', 'This playlist has no songs.');

      let q = ctx.client.music.getQueue(ctx.guild.id) || ctx.client.music.createQueue(ctx.guild.id, ctx.channel, voiceChannel);
      tracks.forEach(t => {
        q.songs.push({
          title: t.title,
          url: t.url,
          durationStr: t.duration || '3:30',
          durationMs: 210000,
          thumbnail: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=500',
          source: 'Custom Playlist',
          sourceColor: botConfig.colors.teal,
          requesterId: ctx.user.id
        });
      });

      if (!q.playing) {
        const first = q.songs.shift();
        await ctx.client.music.play(q, first);
      }

      return ctx.sendSuccess('Playlist Enqueued', `🎶 Enqueued **${tracks.length}** tracks from playlist **${pl.name}**!`);
    }

    if (sub === 'delete') {
      if (!plName) return ctx.sendError('Missing Name', 'Specify which playlist to delete.');
      const res = ctx.client.db.prepare('DELETE FROM user_playlists WHERE user_id = ? AND LOWER(name) = LOWER(?)').run(ctx.user.id, plName);
      if (res.changes === 0) return ctx.sendError('Not Found', `Playlist \`${plName}\` does not exist.`);
      return ctx.sendSuccess('Playlist Deleted', `🗑️ Deleted playlist **${plName}**.`);
    }
  }
}

module.exports = PlaylistCommand;
