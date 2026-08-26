const {
  SlashCommandBuilder,
  PermissionFlagsBits,
  ChannelType,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle
} = require('discord.js');
const Command = require('../Command.js');
const RotiEmbed = require('../../utils/embed.js');
const botConfig = require('../../config.js');

class SuggestionCommand extends Command {
  constructor() {
    super({
      name: 'suggestion',
      description: 'Manage and configure server suggestions system',
      category: 'Server',
      aliases: ['suggest', 'sug'],
      usage: 'suggestion <set/accept/decline/config/info> [options] OR suggest <text>',
      slashData: new SlashCommandBuilder()
        .setName('suggestion')
        .setDescription('Manage suggestions')
        .addSubcommand(sub => sub.setName('set').setDescription('Set suggestion channel').addChannelOption(opt => opt.setName('channel').setDescription('Channel').addChannelTypes(ChannelType.GuildText).setRequired(true)))
        .addSubcommand(sub => sub.setName('submit').setDescription('Submit a suggestion').addStringOption(opt => opt.setName('suggestion').setDescription('Your idea / feedback').setRequired(true)).addStringOption(opt => opt.setName('image').setDescription('Optional image attachment URL')).addBooleanOption(opt => opt.setName('anonymous').setDescription('Submit anonymously')))
        .addSubcommand(sub => sub.setName('accept').setDescription('Accept a suggestion').addIntegerOption(opt => opt.setName('id').setDescription('Suggestion ID').setRequired(true)).addStringOption(opt => opt.setName('reason').setDescription('Reason for approval')))
        .addSubcommand(sub => sub.setName('decline').setDescription('Decline a suggestion').addIntegerOption(opt => opt.setName('id').setDescription('Suggestion ID').setRequired(true)).addStringOption(opt => opt.setName('reason').setDescription('Reason for decline')))
        .addSubcommand(sub => sub.setName('config').setDescription('Configure suggestion settings'))
        .addSubcommand(sub => sub.setName('info').setDescription('View author information for a suggestion').addIntegerOption(opt => opt.setName('id').setDescription('Suggestion ID').setRequired(true)))
    });
  }

  async execute(ctx, args) {
    const isDirectSuggest = ctx.raw.commandName === 'suggest' || (args[0] && !['set', 'accept', 'decline', 'config', 'info', 'submit'].includes(args[0].toLowerCase()));
    const sub = ctx.isSlash ? ctx.raw.options.getSubcommand() : (isDirectSuggest ? 'submit' : args[0]?.toLowerCase());
    const guild = ctx.guild;

    // === SUBMIT ===
    if (sub === 'submit') {
      const conf = ctx.client.db.prepare('SELECT * FROM suggestion_config WHERE guild_id = ?').get(guild.id);
      if (!conf || !conf.channel_id) {
        return ctx.sendError('No Suggestion Channel', 'Suggestions channel is not configured on this server. An admin can set one using `/suggestion set #channel`.');
      }

      const sugChannel = guild.channels.cache.get(conf.channel_id);
      if (!sugChannel) return ctx.sendError('Channel Not Found', 'Configured suggestion channel no longer exists.');

      const text = ctx.isSlash ? ctx.raw.options.getString('suggestion') : (isDirectSuggest ? args.join(' ') : args.slice(1).join(' '));
      if (!text) return ctx.sendError('Missing Content', 'Please provide your suggestion text.');

      const image = ctx.isSlash ? ctx.raw.options.getString('image') : null;
      const anonymous = ctx.isSlash ? (ctx.raw.options.getBoolean('anonymous') || false) : false;

      const sugId = (ctx.client.db.prepare('SELECT MAX(id) FROM suggestions WHERE guild_id = ?').pluck().get(guild.id) || 0) + 1;

      const sugEmbed = new RotiEmbed()
        .setTitle(`💡 Suggestion #${sugId}`)
        .setDescription(text)
        .addFields(
          { name: 'Submitted by', value: anonymous ? '*Anonymous*' : `<@${ctx.user.id}> (${ctx.user.tag})`, inline: true },
          { name: 'Status', value: '⏳ Pending Review', inline: true }
        )
        .setColor(botConfig.colors.teal);

      if (image) sugEmbed.setImage(image);

      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId(`sug_up:${sugId}`).setLabel('0 👍').setStyle(ButtonStyle.Success),
        new ButtonBuilder().setCustomId(`sug_down:${sugId}`).setLabel('0 👎').setStyle(ButtonStyle.Danger),
        new ButtonBuilder().setCustomId(`sug_thread:${sugId}`).setLabel('Discussion').setEmoji('💬').setStyle(ButtonStyle.Secondary)
      );

      const msg = await sugChannel.send({ embeds: [sugEmbed], components: [row] });

      ctx.client.db.prepare(`
        INSERT INTO suggestions (id, guild_id, user_id, channel_id, message_id, suggestion_text, image_url, anonymous, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(sugId, guild.id, ctx.user.id, sugChannel.id, msg.id, text, image, anonymous ? 1 : 0, Date.now());

      return ctx.sendSuccess('Suggestion Submitted', `Your suggestion has been posted in <#${sugChannel.id}>! (Suggestion #${sugId})`);
    }

    // === SET CHANNEL ===
    if (sub === 'set') {
      if (!ctx.member.permissions.has(PermissionFlagsBits.ManageGuild)) {
        return ctx.sendError('Permission Denied', 'You need Manage Server permissions.');
      }
      const channel = ctx.isSlash ? ctx.raw.options.getChannel('channel') : (ctx.guild.channels.cache.get(args[1]?.replace(/<#|>/g, '')) || ctx.channel);
      ctx.client.db.prepare('INSERT OR REPLACE INTO suggestion_config (guild_id, channel_id) VALUES (?, ?)').run(guild.id, channel.id);
      return ctx.sendSuccess('Suggestion Channel Set', `Suggestions will now be directed to <#${channel.id}>!`);
    }

    // === ACCEPT ===
    if (sub === 'accept') {
      if (!ctx.member.permissions.has(PermissionFlagsBits.ManageMessages)) {
        return ctx.sendError('Permission Denied', 'You need Manage Messages permissions.');
      }
      const id = ctx.isSlash ? ctx.raw.options.getInteger('id') : parseInt(args[1]);
      const reason = ctx.isSlash ? (ctx.raw.options.getString('reason') || 'Approved by staff') : (args.slice(2).join(' ') || 'Approved by staff');

      const sug = ctx.client.db.prepare('SELECT * FROM suggestions WHERE guild_id = ? AND id = ?').get(guild.id, id);
      if (!sug) return ctx.sendError('Not Found', `Suggestion #${id} not found.`);

      ctx.client.db.prepare("UPDATE suggestions SET status = 'accepted', response_reason = ?, responder_id = ? WHERE guild_id = ? AND id = ?")
        .run(reason, ctx.user.id, guild.id, id);

      const chan = guild.channels.cache.get(sug.channel_id);
      if (chan) {
        const msg = await chan.messages.fetch(sug.message_id).catch(() => null);
        if (msg) {
          const embed = RotiEmbed.from(msg.embeds[0])
            .setColor(botConfig.colors.success)
            .setFields(
              { name: 'Submitted by', value: sug.anonymous ? '*Anonymous*' : `<@${sug.user_id}>`, inline: true },
              { name: 'Status', value: '✅ **Accepted**', inline: true },
              { name: 'Staff Reason', value: reason, inline: false }
            );
          await msg.edit({ embeds: [embed] }).catch(() => {});
        }
      }

      // DM Author
      const author = await ctx.client.users.fetch(sug.user_id).catch(() => null);
      if (author) {
        author.send({
          embeds: [RotiEmbed.success(`Suggestion #${id} Accepted!`, `Your suggestion in **${guild.name}** was **accepted**!\n**Reason:** ${reason}`)]
        }).catch(() => {});
      }

      return ctx.sendSuccess('Suggestion Accepted', `Suggestion #${id} marked as accepted!`);
    }

    // === DECLINE ===
    if (sub === 'decline') {
      if (!ctx.member.permissions.has(PermissionFlagsBits.ManageMessages)) {
        return ctx.sendError('Permission Denied', 'You need Manage Messages permissions.');
      }
      const id = ctx.isSlash ? ctx.raw.options.getInteger('id') : parseInt(args[1]);
      const reason = ctx.isSlash ? (ctx.raw.options.getString('reason') || 'Declined by staff') : (args.slice(2).join(' ') || 'Declined by staff');

      const sug = ctx.client.db.prepare('SELECT * FROM suggestions WHERE guild_id = ? AND id = ?').get(guild.id, id);
      if (!sug) return ctx.sendError('Not Found', `Suggestion #${id} not found.`);

      ctx.client.db.prepare("UPDATE suggestions SET status = 'declined', response_reason = ?, responder_id = ? WHERE guild_id = ? AND id = ?")
        .run(reason, ctx.user.id, guild.id, id);

      const chan = guild.channels.cache.get(sug.channel_id);
      if (chan) {
        const msg = await chan.messages.fetch(sug.message_id).catch(() => null);
        if (msg) {
          const embed = RotiEmbed.from(msg.embeds[0])
            .setColor(botConfig.colors.error)
            .setFields(
              { name: 'Submitted by', value: sug.anonymous ? '*Anonymous*' : `<@${sug.user_id}>`, inline: true },
              { name: 'Status', value: '❌ **Declined**', inline: true },
              { name: 'Staff Reason', value: reason, inline: false }
            );
          await msg.edit({ embeds: [embed] }).catch(() => {});
        }
      }

      // DM Author
      const author = await ctx.client.users.fetch(sug.user_id).catch(() => null);
      if (author) {
        author.send({
          embeds: [RotiEmbed.error(`Suggestion #${id} Declined`, `Your suggestion in **${guild.name}** was **declined**.\n**Reason:** ${reason}`)]
        }).catch(() => {});
      }

      return ctx.sendSuccess('Suggestion Declined', `Suggestion #${id} marked as declined.`);
    }

    // === INFO (ANON SUGGESTER) ===
    if (sub === 'info') {
      if (!ctx.member.permissions.has(PermissionFlagsBits.ManageGuild)) {
        return ctx.sendError('Permission Denied', 'You need Manage Server permissions to inspect suggesters.');
      }
      const id = ctx.isSlash ? ctx.raw.options.getInteger('id') : parseInt(args[1]);
      const sug = ctx.client.db.prepare('SELECT * FROM suggestions WHERE guild_id = ? AND id = ?').get(guild.id, id);
      if (!sug) return ctx.sendError('Not Found', `Suggestion #${id} not found.`);

      const embed = new RotiEmbed()
        .setTitle(`🔍 Suggestion #${id} Info`)
        .addFields(
          { name: 'Author', value: `<@${sug.user_id}> (ID: ${sug.user_id})`, inline: true },
          { name: 'Anonymous', value: sug.anonymous ? 'Yes' : 'No', inline: true },
          { name: 'Status', value: sug.status, inline: true },
          { name: 'Content', value: sug.suggestion_text, inline: false }
        )
        .setColor(botConfig.colors.teal);
      return ctx.reply({ embeds: [embed], ephemeral: true });
    }
  }
}

module.exports = SuggestionCommand;
