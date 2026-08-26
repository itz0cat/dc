const { SlashCommandBuilder, PermissionFlagsBits, ChannelType } = require('discord.js');
const Command = require('../Command.js');
const RotiEmbed = require('../../utils/embed.js');
const botConfig = require('../../config.js');

class GreetCommand extends Command {
  constructor() {
    super({
      name: 'greet',
      description: 'Configure advanced Falcon welcome greetings with inviter tags, embeds, and auto-delete',
      category: 'Server',
      aliases: ['greeting', 'welcomer'],
      usage: 'greet <set/test/disable> [options]',
      userPermissions: [PermissionFlagsBits.ManageGuild],
      slashData: new SlashCommandBuilder()
        .setName('greet')
        .setDescription('Configure advanced greet system')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
        .addSubcommand(sub => sub.setName('set').setDescription('Set greet channel and message').addChannelOption(opt => opt.setName('channel').setDescription('Welcome channel').addChannelTypes(ChannelType.GuildText).setRequired(true)).addStringOption(opt => opt.setName('message').setDescription('Custom message (supports {member}, {server}, {count}, {inviter}, {invites})').setRequired(true)).addBooleanOption(opt => opt.setName('embed').setDescription('Send as embed (default: true)')))
        .addSubcommand(sub => sub.setName('test').setDescription('Send a test greet message'))
        .addSubcommand(sub => sub.setName('disable').setDescription('Disable greeting messages'))
    });
  }

  async execute(ctx, args) {
    const sub = ctx.isSlash ? ctx.raw.options.getSubcommand() : (args[0]?.toLowerCase() || 'set');
    const guild = ctx.guild;

    if (sub === 'set') {
      const channel = ctx.isSlash ? ctx.raw.options.getChannel('channel') : (ctx.raw.mentions.channels.first() || guild.channels.cache.get(args[1]));
      const messageText = ctx.isSlash ? ctx.raw.options.getString('message') : args.slice(2).join(' ');
      const useEmbed = ctx.isSlash ? (ctx.raw.options.getBoolean('embed') !== false ? 1 : 0) : 1;

      if (!channel || !messageText) {
        return ctx.sendError('Invalid Usage', 'Usage: `?greet set <#channel> <message>`\nPlaceholders: `{member}`, `{username}`, `{server}`, `{count}`, `{inviter}`, `{invites}`');
      }

      ctx.client.db.prepare(`
        UPDATE guild_settings
        SET welcome_channel_id = ?, welcome_message = ?, welcome_embed = ?
        WHERE guild_id = ?
      `).run(channel.id, messageText, useEmbed, guild.id);

      return ctx.sendSuccess('Greet Configured', `👋 Welcome greetings will now be sent in <#${channel.id}>!\n\n**Preview:**\n${messageText}`);
    }

    if (sub === 'test') {
      const settings = ctx.client.db.getGuild(guild.id);
      if (!settings.welcome_channel_id) {
        return ctx.sendError('Not Configured', 'Greet channel is not yet configured. Use `?greet set <#channel> <message>` first.');
      }

      const chan = guild.channels.cache.get(settings.welcome_channel_id);
      if (!chan) return ctx.sendError('Channel Not Found', 'Configured greet channel no longer exists.');

      const text = (settings.welcome_message || 'Welcome {member} to {server}! You were invited by {inviter} ({invites} invites).')
        .replace(/\{member\}|\?member/g, `<@${ctx.user.id}>`)
        .replace(/\{username\}|\?username/g, ctx.user.username)
        .replace(/\{server\}|\?server/g, guild.name)
        .replace(/\{count\}|\{size\}|\?size/g, guild.memberCount)
        .replace(/\{inviter\}/g, `<@${ctx.user.id}>`)
        .replace(/\{invites\}/g, '5');

      if (settings.welcome_embed) {
        const embed = new RotiEmbed()
          .setTitle(`👋 Welcome to ${guild.name}!`)
          .setDescription(text)
          .setThumbnail(ctx.user.displayAvatarURL())
          .setColor(botConfig.colors.teal);
        await chan.send({ embeds: [embed] });
      } else {
        await chan.send({ content: text });
      }

      return ctx.sendSuccess('Test Sent', `Sent a test greet message to <#${chan.id}>!`);
    }

    if (sub === 'disable') {
      ctx.client.db.prepare('UPDATE guild_settings SET welcome_channel_id = NULL WHERE guild_id = ?').run(guild.id);
      return ctx.sendSuccess('Greet Disabled', 'Welcome greetings have been disabled.');
    }
  }
}

module.exports = GreetCommand;
