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
const { createTranscript } = require('../../utils/transcript.js');

class TicketCommand extends Command {
  constructor() {
    super({
      name: 'ticket',
      description: 'Comprehensive support ticket system commands',
      category: 'Server',
      usage: 'ticket <setup/config/add/remove/close/rename/stats/leaderboard> [options]',
      userPermissions: [PermissionFlagsBits.ManageChannels],
      slashData: new SlashCommandBuilder()
        .setName('ticket')
        .setDescription('Support ticket system')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels)
        .addSubcommand(sub => sub.setName('setup').setDescription('Setup the ticket panel').addChannelOption(opt => opt.setName('channel').setDescription('Channel to place ticket panel').addChannelTypes(ChannelType.GuildText)))
        .addSubcommand(sub => sub.setName('config').setDescription('Configure ticket role, log channel, and parent category').addRoleOption(opt => opt.setName('role').setDescription('Staff role for tickets')).addChannelOption(opt => opt.setName('log_channel').setDescription('Log channel for transcripts')).addChannelOption(opt => opt.setName('category').setDescription('Parent category for tickets').addChannelTypes(ChannelType.GuildCategory)))
        .addSubcommand(sub => sub.setName('add').setDescription('Add user or role to ticket').addUserOption(opt => opt.setName('user').setDescription('User to add').setRequired(true)))
        .addSubcommand(sub => sub.setName('remove').setDescription('Remove user or role from ticket').addUserOption(opt => opt.setName('user').setDescription('User to remove').setRequired(true)))
        .addSubcommand(sub => sub.setName('close').setDescription('Close current ticket').addStringOption(opt => opt.setName('reason').setDescription('Reason for closing')))
        .addSubcommand(sub => sub.setName('rename').setDescription('Rename ticket channel').addStringOption(opt => opt.setName('name').setDescription('New channel name').setRequired(true)))
        .addSubcommand(sub => sub.setName('stats').setDescription('Display ticket system statistics'))
        .addSubcommand(sub => sub.setName('leaderboard').setDescription('Show top staff members by tickets closed'))
    });
  }

  async execute(ctx, args) {
    const sub = ctx.isSlash ? ctx.raw.options.getSubcommand() : (args[0]?.toLowerCase() || 'stats');
    const guild = ctx.guild;

    // === SETUP ===
    if (sub === 'setup') {
      const channel = ctx.isSlash ? (ctx.raw.options.getChannel('channel') || ctx.channel) : (ctx.guild.channels.cache.get(args[1]?.replace(/<#|>/g, '')) || ctx.channel);
      
      const panelEmbed = new RotiEmbed()
        .setTitle('🎫 Server Support & Assistance')
        .setDescription('Need help, have an inquiry, or want to report an issue?\nClick the button below to open a private support ticket with our team.')
        .addFields(
          { name: '📋 Guidelines', value: '• Be patient after creating a ticket\n• Provide details regarding your issue\n• Staff will be with you as soon as possible' }
        )
        .setColor(botConfig.colors.teal);

      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId('ticket_create:Support')
          .setLabel('Open Ticket')
          .setEmoji('🎫')
          .setStyle(ButtonStyle.Success),
        new ButtonBuilder()
          .setCustomId('ticket_create:Billing')
          .setLabel('General Inquiry')
          .setEmoji('💬')
          .setStyle(ButtonStyle.Primary)
      );

      const msg = await channel.send({ embeds: [panelEmbed], components: [row] });
      ctx.client.db.prepare(`
        INSERT OR REPLACE INTO ticket_panels (guild_id, channel_id, message_id)
        VALUES (?, ?, ?)
      `).run(guild.id, channel.id, msg.id);

      return ctx.sendSuccess('Ticket Panel Created', `Ticket panel is now active in <#${channel.id}>!`);
    }

    // === CONFIG ===
    if (sub === 'config') {
      const role = ctx.isSlash ? ctx.raw.options.getRole('role') : null;
      const logChannel = ctx.isSlash ? ctx.raw.options.getChannel('log_channel') : null;
      const category = ctx.isSlash ? ctx.raw.options.getChannel('category') : null;

      let panel = ctx.client.db.prepare('SELECT * FROM ticket_panels WHERE guild_id = ?').get(guild.id);
      if (!panel) {
        ctx.client.db.prepare('INSERT INTO ticket_panels (guild_id) VALUES (?)').run(guild.id);
        panel = ctx.client.db.prepare('SELECT * FROM ticket_panels WHERE guild_id = ?').get(guild.id);
      }

      if (role) ctx.client.db.prepare('UPDATE ticket_panels SET role_id = ? WHERE guild_id = ?').run(role.id, guild.id);
      if (logChannel) ctx.client.db.prepare('UPDATE ticket_panels SET log_channel_id = ? WHERE guild_id = ?').run(logChannel.id, guild.id);
      if (category) ctx.client.db.prepare('UPDATE ticket_panels SET parent_category_id = ? WHERE guild_id = ?').run(category.id, guild.id);

      const updated = ctx.client.db.prepare('SELECT * FROM ticket_panels WHERE guild_id = ?').get(guild.id);
      const embed = new RotiEmbed()
        .setTitle('⚙️ Ticket System Configuration')
        .addFields(
          { name: 'Staff Role', value: updated.role_id ? `<@&${updated.role_id}>` : '*Not Set*', inline: true },
          { name: 'Log Channel', value: updated.log_channel_id ? `<#${updated.log_channel_id}>` : '*Not Set*', inline: true },
          { name: 'Category', value: updated.parent_category_id ? `<#${updated.parent_category_id}>` : '*Not Set*', inline: true }
        )
        .setColor(botConfig.colors.teal);
      return ctx.reply({ embeds: [embed] });
    }

    // === ADD ===
    if (sub === 'add') {
      const user = ctx.isSlash ? ctx.raw.options.getUser('user') : ctx.raw.mentions.users.first();
      if (!user) return ctx.sendError('Invalid Target', 'Please specify a valid user.');

      await ctx.channel.permissionOverwrites.edit(user.id, {
        ViewChannel: true,
        SendMessages: true,
        AttachFiles: true,
        EmbedLinks: true,
        ReadMessageHistory: true
      });

      return ctx.sendSuccess('Member Added', `<@${user.id}> has been added to this ticket.`);
    }

    // === REMOVE ===
    if (sub === 'remove') {
      const user = ctx.isSlash ? ctx.raw.options.getUser('user') : ctx.raw.mentions.users.first();
      if (!user) return ctx.sendError('Invalid Target', 'Please specify a valid user.');

      await ctx.channel.permissionOverwrites.delete(user.id).catch(() => {});
      return ctx.sendSuccess('Member Removed', `<@${user.id}> has been removed from this ticket.`);
    }

    // === CLOSE ===
    if (sub === 'close') {
      const ticket = ctx.client.db.prepare('SELECT * FROM tickets WHERE channel_id = ?').get(ctx.channel.id);
      if (!ticket) return ctx.sendError('Not a Ticket', 'This command can only be used inside a ticket channel.');

      const reason = ctx.isSlash ? (ctx.raw.options.getString('reason') || 'No reason provided') : (args.slice(1).join(' ') || 'No reason provided');

      await ctx.reply({ embeds: [RotiEmbed.warning('Closing Ticket', 'Saving transcript and closing in 5 seconds...')] });

      ctx.client.db.prepare("UPDATE tickets SET status = 'closed', closed_at = ?, close_reason = ? WHERE id = ?")
        .run(Date.now(), reason, ticket.id);

      const transcript = await createTranscript(ctx.channel);
      const creator = await ctx.client.users.fetch(ticket.user_id).catch(() => null);
      if (creator && transcript) {
        creator.send({
          embeds: [RotiEmbed.info('Ticket Closed', `Your ticket in **${guild.name}** has been resolved.\n**Reason:** ${reason}`)],
          files: [transcript]
        }).catch(() => {});
      }

      const panel = ctx.client.db.prepare('SELECT log_channel_id FROM ticket_panels WHERE guild_id = ?').get(guild.id);
      if (panel && panel.log_channel_id) {
        const logChan = guild.channels.cache.get(panel.log_channel_id);
        if (logChan && transcript) {
          logChan.send({
            embeds: [RotiEmbed.info('Ticket Closed Log', `**Ticket:** #${ctx.channel.name}\n**User:** <@${ticket.user_id}>\n**Closed by:** <@${ctx.user.id}>\n**Reason:** ${reason}`)],
            files: [transcript]
          }).catch(() => {});
        }
      }

      setTimeout(() => {
        ctx.channel.delete('Ticket closed').catch(() => {});
      }, 5000);
      return;
    }

    // === RENAME ===
    if (sub === 'rename') {
      const newName = ctx.isSlash ? ctx.raw.options.getString('name') : args.slice(1).join('-');
      if (!newName) return ctx.sendError('Missing Name', 'Please specify a new channel name.');
      await ctx.channel.setName(newName);
      return ctx.sendSuccess('Ticket Renamed', `Ticket channel renamed to **#${newName}**!`);
    }

    // === STATS ===
    if (sub === 'stats') {
      const total = ctx.client.db.prepare('SELECT COUNT(*) FROM tickets WHERE guild_id = ?').pluck().get(guild.id) || 0;
      const open = ctx.client.db.prepare("SELECT COUNT(*) FROM tickets WHERE guild_id = ? AND status = 'open'").pluck().get(guild.id) || 0;
      const claimed = ctx.client.db.prepare("SELECT COUNT(*) FROM tickets WHERE guild_id = ? AND status = 'claimed'").pluck().get(guild.id) || 0;
      const closed = ctx.client.db.prepare("SELECT COUNT(*) FROM tickets WHERE guild_id = ? AND status = 'closed'").pluck().get(guild.id) || 0;

      const embed = new RotiEmbed()
        .setTitle('📊 Ticket System Statistics')
        .addFields(
          { name: 'Total Created', value: `${total}`, inline: true },
          { name: 'Currently Open', value: `${open}`, inline: true },
          { name: 'Currently Claimed', value: `${claimed}`, inline: true },
          { name: 'Total Closed', value: `${closed}`, inline: true }
        )
        .setColor(botConfig.colors.teal);
      return ctx.reply({ embeds: [embed] });
    }

    // === LEADERBOARD ===
    if (sub === 'leaderboard') {
      const topStaff = ctx.client.db.prepare(`
        SELECT claimed_by, COUNT(*) as count 
        FROM tickets 
        WHERE guild_id = ? AND claimed_by IS NOT NULL AND status = 'closed'
        GROUP BY claimed_by 
        ORDER BY count DESC 
        LIMIT 10
      `).all(guild.id);

      let lbText = '*No ticket resolution records yet.*';
      if (topStaff.length > 0) {
        lbText = topStaff.map((s, idx) => `**#${idx + 1}** <@${s.claimed_by}> • **${s.count}** tickets resolved`).join('\n');
      }

      const embed = new RotiEmbed()
        .setTitle('🏆 Staff Ticket Leaderboard')
        .setDescription(lbText)
        .setColor(botConfig.colors.teal);
      return ctx.reply({ embeds: [embed] });
    }
  }
}

module.exports = TicketCommand;
