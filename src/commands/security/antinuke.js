const { SlashCommandBuilder, PermissionFlagsBits, ChannelType } = require('discord.js');
const Command = require('../Command.js');
const RotiEmbed = require('../../utils/embed.js');
const botConfig = require('../../config.js');

class AntiNukeCommand extends Command {
  constructor() {
    super({
      name: 'antinuke',
      description: 'Configure server anti-nuke, anti-raid, and unauthorized bot addition protections',
      category: 'Security',
      aliases: ['security', 'guard'],
      usage: 'antinuke <enable/disable/config/whitelist/unwhitelist/logs> [options]',
      userPermissions: [PermissionFlagsBits.Administrator],
      slashData: new SlashCommandBuilder()
        .setName('antinuke')
        .setDescription('Server anti-nuke and security protections')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .addSubcommand(sub => sub.setName('enable').setDescription('Enable all Anti-Nuke protections'))
        .addSubcommand(sub => sub.setName('disable').setDescription('Disable Anti-Nuke protections'))
        .addSubcommand(sub => sub.setName('config').setDescription('View current security settings'))
        .addSubcommand(sub => sub.setName('whitelist').setDescription('Add trusted admin to whitelist').addUserOption(opt => opt.setName('user').setDescription('User to whitelist').setRequired(true)))
        .addSubcommand(sub => sub.setName('unwhitelist').setDescription('Remove user from whitelist').addUserOption(opt => opt.setName('user').setDescription('User to unwhitelist').setRequired(true)))
        .addSubcommand(sub => sub.setName('logs').setDescription('Set security audit alert channel').addChannelOption(opt => opt.setName('channel').setDescription('Log channel').addChannelTypes(ChannelType.GuildText).setRequired(true)))
    });
  }

  async execute(ctx, args) {
    const sub = ctx.isSlash ? ctx.raw.options.getSubcommand() : (args[0]?.toLowerCase() || 'config');
    const guild = ctx.guild;

    // Only server owner or bot owner can configure Anti-Nuke
    if (ctx.user.id !== guild.ownerId && ctx.user.id !== ctx.client.config.ownerId) {
      return ctx.sendError('Owner Only', 'Only the **Server Owner** can configure Anti-Nuke settings.');
    }

    let config = ctx.client.db.prepare('SELECT * FROM antinuke_configs WHERE guild_id = ?').get(guild.id);
    if (!config) {
      ctx.client.db.prepare(`
        INSERT INTO antinuke_configs (guild_id, enabled, anti_bot, anti_ban, anti_kick, anti_channel, anti_role, anti_webhook, whitelist)
        VALUES (?, 0, 1, 1, 1, 1, 1, 1, '[]')
      `).run(guild.id);
      config = ctx.client.db.prepare('SELECT * FROM antinuke_configs WHERE guild_id = ?').get(guild.id);
    }

    if (sub === 'enable') {
      ctx.client.db.prepare('UPDATE antinuke_configs SET enabled = 1 WHERE guild_id = ?').run(guild.id);
      return ctx.sendSuccess('Anti-Nuke Enabled', '🛡️ **Anti-Nuke Protection is now ACTIVE!**\nUnauthorized bot additions, mass kicks, mass bans, and channel wipes will be automatically blocked.');
    }

    if (sub === 'disable') {
      ctx.client.db.prepare('UPDATE antinuke_configs SET enabled = 0 WHERE guild_id = ?').run(guild.id);
      return ctx.sendWarning('Anti-Nuke Disabled', '⚠️ Anti-Nuke Protection has been **disabled**.');
    }

    if (sub === 'whitelist') {
      const target = ctx.isSlash ? ctx.raw.options.getUser('user') : ctx.raw.mentions.users.first();
      if (!target) return ctx.sendError('Missing User', 'Please specify a user to whitelist.');

      const whitelist = JSON.parse(config.whitelist || '[]');
      if (!whitelist.includes(target.id)) {
        whitelist.push(target.id);
        ctx.client.db.prepare('UPDATE antinuke_configs SET whitelist = ? WHERE guild_id = ?').run(JSON.stringify(whitelist), guild.id);
      }
      return ctx.sendSuccess('User Whitelisted', `✅ <@${target.id}> (${target.tag}) has been added to the Anti-Nuke trusted whitelist.`);
    }

    if (sub === 'unwhitelist') {
      const target = ctx.isSlash ? ctx.raw.options.getUser('user') : ctx.raw.mentions.users.first();
      if (!target) return ctx.sendError('Missing User', 'Please specify a user to unwhitelist.');

      let whitelist = JSON.parse(config.whitelist || '[]');
      whitelist = whitelist.filter(id => id !== target.id);
      ctx.client.db.prepare('UPDATE antinuke_configs SET whitelist = ? WHERE guild_id = ?').run(JSON.stringify(whitelist), guild.id);
      return ctx.sendSuccess('User Unwhitelisted', `Removed <@${target.id}> from the Anti-Nuke whitelist.`);
    }

    if (sub === 'logs') {
      const channel = ctx.isSlash ? ctx.raw.options.getChannel('channel') : ctx.raw.mentions.channels.first();
      if (!channel) return ctx.sendError('Missing Channel', 'Please specify a channel.');

      ctx.client.db.prepare('UPDATE antinuke_configs SET logs_channel_id = ? WHERE guild_id = ?').run(channel.id, guild.id);
      return ctx.sendSuccess('Security Logs Set', `🛡️ Anti-Nuke alerts will be logged in <#${channel.id}>.`);
    }

    if (sub === 'config') {
      const whitelist = JSON.parse(config.whitelist || '[]');
      const wlList = whitelist.length > 0 ? whitelist.map(id => `<@${id}>`).join(', ') : '*None*';

      const embed = new RotiEmbed()
        .setTitle(`🛡️ Anti-Nuke Security Config: ${guild.name}`)
        .setDescription(`**Status:** ${config.enabled ? '🟢 `ACTIVE & PROTECTING`' : '🔴 `DISABLED`'}\n**Security Alert Log Channel:** ${config.logs_channel_id ? `<#${config.logs_channel_id}>` : '*Not Set*'}`)
        .addFields(
          { name: '🤖 Anti-Bot Add', value: config.anti_bot ? '✅ Enabled' : '❌ Disabled', inline: true },
          { name: '🔨 Anti-Mass Ban', value: config.anti_ban ? '✅ Enabled' : '❌ Disabled', inline: true },
          { name: '👢 Anti-Mass Kick', value: config.anti_kick ? '✅ Enabled' : '❌ Disabled', inline: true },
          { name: '📁 Anti-Channel Delete', value: config.anti_channel ? '✅ Enabled' : '❌ Disabled', inline: true },
          { name: '🎭 Anti-Role Delete', value: config.anti_role ? '✅ Enabled' : '❌ Disabled', inline: true },
          { name: '🪝 Anti-Webhook Spam', value: config.anti_webhook ? '✅ Enabled' : '❌ Disabled', inline: true },
          { name: '👑 Whitelisted Admins', value: wlList, inline: false }
        )
        .setColor(config.enabled ? botConfig.colors.teal : botConfig.colors.warning);

      return ctx.reply({ embeds: [embed] });
    }
  }
}

module.exports = AntiNukeCommand;
