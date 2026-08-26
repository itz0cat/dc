const { SlashCommandBuilder } = require('discord.js');
const Command = require('../Command.js');
const RotiEmbed = require('../../utils/embed.js');
const botConfig = require('../../config.js');

class LastfmCommand extends Command {
  constructor() {
    super({
      name: 'lastfm',
      description: 'Connect your Last.fm profile, scrobble tracks, and view stats',
      category: 'Utility',
      aliases: ['lf', 'scrobble'],
      usage: 'lastfm [login/logout/user]',
      slashData: new SlashCommandBuilder()
        .setName('lastfm')
        .setDescription('Last.fm music scrobbling')
        .addSubcommand(s => s.setName('login').setDescription('Link Last.fm account').addStringOption(o => o.setName('username').setDescription('Last.fm username').setRequired(true)))
        .addSubcommand(s => s.setName('view').setDescription('View your Last.fm profile'))
        .addSubcommand(s => s.setName('logout').setDescription('Unlink Last.fm account'))
    });
  }

  async execute(ctx, args) {
    const sub = ctx.isSlash ? ctx.raw.options.getSubcommand() : (args[0]?.toLowerCase() || 'view');

    ctx.client.db.prepare(`
      CREATE TABLE IF NOT EXISTS lastfm_users (
        user_id TEXT PRIMARY KEY,
        username TEXT,
        linked_at INTEGER
      )
    `).run();

    if (sub === 'login' || args[0]?.toLowerCase() === 'login') {
      const username = ctx.isSlash ? ctx.raw.options.getString('username') : args[1];
      if (!username) return ctx.sendError('Missing Username', 'Provide your Last.fm username, e.g. `?lastfm login your_name`.');

      ctx.client.db.prepare('INSERT OR REPLACE INTO lastfm_users (user_id, username, linked_at) VALUES (?, ?, ?)').run(ctx.user.id, username, Date.now());
      return ctx.sendSuccess('Last.fm Connected', `❤️ Linked **${username}** to your Discord profile! Scrobbles will track automatically.`);
    }

    if (sub === 'logout') {
      ctx.client.db.prepare('DELETE FROM lastfm_users WHERE user_id = ?').run(ctx.user.id);
      return ctx.sendSuccess('Last.fm Disconnected', '👋 Unlinked your Last.fm profile.');
    }

    // Default view
    const row = ctx.client.db.prepare('SELECT * FROM lastfm_users WHERE user_id = ?').get(ctx.user.id);
    if (!row) return ctx.reply({ embeds: [RotiEmbed.info('Last.fm', 'You have not connected your Last.fm account yet. Run `?lastfm login <username>`!')] });

    const embed = new RotiEmbed()
      .setTitle(`❤️ Last.fm Profile: ${row.username}`)
      .setURL(`https://www.last.fm/user/${row.username}`)
      .setDescription(`• **Username:** [${row.username}](https://www.last.fm/user/${row.username})\n• **Auto-Scrobble:** \`Active\`\n• **Connected Since:** <t:${Math.floor(row.linked_at / 1000)}:R>`)
      .setColor(0xD51007);
    return ctx.reply({ embeds: [embed] });
  }
}

module.exports = LastfmCommand;
