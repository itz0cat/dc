const { SlashCommandBuilder } = require('discord.js');
const Command = require('../Command.js');
const RotiEmbed = require('../../utils/embed.js');
const botConfig = require('../../config.js');
const { formatDuration } = require('../../utils/time.js');

class VoicetimeCommand extends Command {
  constructor() {
    super({
      name: 'voicetime',
      description: 'Check your own or another member\'s voice channel activity time',
      category: 'Tracking',
      aliases: ['vt', 'myvoice', 'voicestats'],
      usage: 'voicetime [user]',
      slashData: new SlashCommandBuilder()
        .setName('voicetime')
        .setDescription('View voice activity statistics')
        .addUserOption(opt => opt.setName('user').setDescription('Target user to inspect'))
    });
  }

  async execute(ctx, args) {
    const targetUser = ctx.isSlash ? (ctx.raw.options.getUser('user') || ctx.user) : (ctx.raw.mentions.users.first() || ctx.user);
    const guild = ctx.guild;

    const data = ctx.client.db.prepare('SELECT * FROM voice_stats WHERE guild_id = ? AND user_id = ?').get(guild.id, targetUser.id) || {
      total_time_ms: 0,
      joined_at: 0
    };

    let totalMs = data.total_time_ms;
    let isLive = false;
    if (data.joined_at > 0) {
      totalMs += (Date.now() - data.joined_at);
      isLive = true;
    }

    const formattedTime = formatDuration(totalMs);

    const embed = new RotiEmbed()
      .setTitle(`🎙️ Voice Statistics: ${targetUser.username}`)
      .setDescription(`<@${targetUser.id}> has spent **${formattedTime}** in voice channels in **${guild.name}**!`)
      .setThumbnail(targetUser.displayAvatarURL())
      .addFields(
        { name: '⏱️ Total Voice Time', value: `\`${formattedTime}\``, inline: true },
        { name: '🟢 Current Status', value: isLive ? '`🔊 Currently in Voice`' : '`Offline / Inactive`', inline: true }
      )
      .setColor(botConfig.colors.teal);

    return ctx.reply({ embeds: [embed] });
  }
}

module.exports = VoicetimeCommand;
