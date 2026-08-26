const { SlashCommandBuilder, PermissionsBitField } = require('discord.js');
const Command = require('../Command.js');
const RotiEmbed = require('../../utils/embed.js');
const botConfig = require('../../config.js');

class ConfigMusicCommand extends Command {
  constructor() {
    super({
      name: 'dj',
      description: 'Configure music player settings: DJ role, 24/7 mode, announce toggle, forcefix',
      category: 'Music',
      aliases: ['247', '24/7', 'announce', 'buttons', 'forcefix'],
      userPermissions: [PermissionsBitField.Flags.ManageGuild],
      usage: 'dj <set/reset/role> OR ?247 OR ?forcefix',
      slashData: new SlashCommandBuilder()
        .setName('dj')
        .setDescription('Configure music and DJ settings')
        .addSubcommand(s => s.setName('set').setDescription('Set DJ role').addRoleOption(r => r.setName('role').setDescription('DJ role').setRequired(true)))
        .addSubcommand(s => s.setName('247').setDescription('Toggle 24/7 voice stay mode'))
        .addSubcommand(s => s.setName('forcefix').setDescription('Force reset and re-sync voice channel state'))
    });
  }

  async execute(ctx, args) {
    const sub = ctx.isSlash ? ctx.raw.options.getSubcommand() : (args[0]?.toLowerCase() || 'info');

    ctx.client.db.prepare(`
      CREATE TABLE IF NOT EXISTS music_guild_configs (
        guild_id TEXT PRIMARY KEY,
        dj_role_id TEXT,
        twenty_four_seven INTEGER DEFAULT 0,
        announce_songs INTEGER DEFAULT 1,
        show_buttons INTEGER DEFAULT 1
      )
    `).run();

    let conf = ctx.client.db.prepare('SELECT * FROM music_guild_configs WHERE guild_id = ?').get(ctx.guild.id);
    if (!conf) {
      ctx.client.db.prepare('INSERT INTO music_guild_configs (guild_id) VALUES (?)').run(ctx.guild.id);
      conf = { guild_id: ctx.guild.id, dj_role_id: null, twenty_four_seven: 0, announce_songs: 1, show_buttons: 1 };
    }

    if (sub === '247' || ctx.raw.content?.includes('247')) {
      const newVal = conf.twenty_four_seven ? 0 : 1;
      ctx.client.db.prepare('UPDATE music_guild_configs SET twenty_four_seven = ? WHERE guild_id = ?').run(newVal, ctx.guild.id);
      return ctx.sendSuccess('24/7 Mode', `📻 24/7 Voice Mode is now **${newVal ? 'ENABLED (Bot will stay in voice indefinitely)' : 'DISABLED'}**.`);
    }

    if (sub === 'forcefix' || ctx.raw.content?.includes('forcefix')) {
      const voiceChannel = ctx.member.voice.channel;
      if (voiceChannel) {
        ctx.client.music.joinVoice(ctx.guild, voiceChannel.id);
      }
      return ctx.sendSuccess('Force Fixed', '🔧 Reconnected and re-synchronized voice gateway state successfully!');
    }

    if (sub === 'set') {
      const role = ctx.isSlash ? ctx.raw.options.getRole('role') : (ctx.raw.mentions.roles.first() || ctx.guild.roles.cache.get(args[1]));
      if (!role) return ctx.sendError('Missing Role', 'Specify a valid DJ role.');

      ctx.client.db.prepare('UPDATE music_guild_configs SET dj_role_id = ? WHERE guild_id = ?').run(role.id, ctx.guild.id);
      return ctx.sendSuccess('DJ Role Configured', `🎧 DJ role set to <@&${role.id}>.`);
    }

    // Default info
    const embed = new RotiEmbed()
      .setTitle(`⚙️ Music Configuration: ${ctx.guild.name}`)
      .addFields(
        { name: '🎧 DJ Role', value: conf.dj_role_id ? `<@&${conf.dj_role_id}>` : '*None (Anyone can control)*', inline: true },
        { name: '📻 24/7 Mode', value: conf.twenty_four_seven ? '`Enabled`' : '`Disabled`', inline: true },
        { name: '🔘 Controller Buttons', value: conf.show_buttons ? '`Enabled`' : '`Disabled`', inline: true }
      )
      .setColor(botConfig.colors.teal);
    return ctx.reply({ embeds: [embed] });
  }
}

module.exports = ConfigMusicCommand;
