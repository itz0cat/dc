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
const { parseDuration, formatDuration } = require('../../utils/time.js');
const { endGiveaway } = require('../../handlers/giveawayHandler.js');

class GiveawayCommand extends Command {
  constructor() {
    super({
      name: 'giveaway',
      description: 'Host, manage, and configure interactive giveaways',
      category: 'Giveaway',
      aliases: ['gstart', 'gend', 'greroll'],
      usage: 'giveaway <start/drop/end/reroll/pause/resume/delete/list> [options]',
      userPermissions: [PermissionFlagsBits.ManageGuild],
      slashData: new SlashCommandBuilder()
        .setName('giveaway')
        .setDescription('Manage giveaways')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
        .addSubcommand(sub => sub.setName('start').setDescription('Start a timed giveaway').addStringOption(opt => opt.setName('prize').setDescription('Prize to win').setRequired(true)).addStringOption(opt => opt.setName('duration').setDescription('Duration (e.g. 1h, 1d)').setRequired(true)).addIntegerOption(opt => opt.setName('winners').setDescription('Number of winners (default: 1)').setMinValue(1)).addRoleOption(opt => opt.setName('required_role').setDescription('Role required to enter')).addChannelOption(opt => opt.setName('channel').setDescription('Channel').addChannelTypes(ChannelType.GuildText)))
        .addSubcommand(sub => sub.setName('drop').setDescription('Quick reaction drop giveaway').addStringOption(opt => opt.setName('prize').setDescription('Prize').setRequired(true)).addIntegerOption(opt => opt.setName('winners').setDescription('Number of winners').setMinValue(1)).addChannelOption(opt => opt.setName('channel').setDescription('Channel').addChannelTypes(ChannelType.GuildText)))
        .addSubcommand(sub => sub.setName('end').setDescription('End an active giveaway early').addStringOption(opt => opt.setName('message_id').setDescription('Giveaway Message ID').setRequired(true)))
        .addSubcommand(sub => sub.setName('reroll').setDescription('Pick new winners for an ended giveaway').addStringOption(opt => opt.setName('message_id').setDescription('Giveaway Message ID').setRequired(true)))
        .addSubcommand(sub => sub.setName('delete').setDescription('Delete a giveaway').addStringOption(opt => opt.setName('message_id').setDescription('Giveaway Message ID').setRequired(true)))
        .addSubcommand(sub => sub.setName('list').setDescription('List active giveaways in this server'))
    });
  }

  async execute(ctx, args) {
    const sub = ctx.isSlash ? ctx.raw.options.getSubcommand() : (args[0]?.toLowerCase() || 'start');
    const guild = ctx.guild;

    // === START ===
    if (sub === 'start') {
      const durationStr = ctx.isSlash ? ctx.raw.options.getString('duration') : args[1];
      const winnersCount = ctx.isSlash ? (ctx.raw.options.getInteger('winners') || 1) : (parseInt(args[2]) || 1);
      const prize = ctx.isSlash ? ctx.raw.options.getString('prize') : args.slice(3).join(' ');
      const requiredRole = ctx.isSlash ? ctx.raw.options.getRole('required_role') : null;
      const channel = ctx.isSlash ? (ctx.raw.options.getChannel('channel') || ctx.channel) : ctx.channel;

      if (!durationStr || !prize) return ctx.sendError('Missing Parameters', 'Usage: `giveaway start <duration> <winners> <prize>`');

      const durationMs = parseDuration(durationStr);
      if (!durationMs) return ctx.sendError('Invalid Duration', 'Please use a valid time format like `10m`, `1h`, `1d`.');

      const endTime = Date.now() + durationMs;

      // Insert DB record
      const res = ctx.client.db.prepare(`
        INSERT INTO giveaways (guild_id, channel_id, prize, winner_count, host_id, end_time, status, required_role_id)
        VALUES (?, ?, ?, ?, ?, ?, "active", ?)
      `).run(guild.id, channel.id, prize, winnersCount, ctx.user.id, endTime, requiredRole?.id || null);

      const gaId = res.lastInsertRowid;

      const gaEmbed = new RotiEmbed()
        .setTitle(`🎉 GIVEAWAY: ${prize}`)
        .setDescription(`Click the **Enter** button below to participate!\n\n**Winners:** \`${winnersCount}\`\n**Ends In:** <t:${Math.floor(endTime / 1000)}:R> (<t:${Math.floor(endTime / 1000)}:f>)\n**Hosted by:** <@${ctx.user.id}>`)
        .setColor(botConfig.colors.teal);

      if (requiredRole) {
        gaEmbed.addFields({ name: 'Requirement', value: `Must have <@&${requiredRole.id}>` });
      }

      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId(`ga_enter:${gaId}`).setLabel('Enter Giveaway').setEmoji('🎉').setStyle(ButtonStyle.Success)
      );

      const msg = await channel.send({ embeds: [gaEmbed], components: [row] });
      ctx.client.db.prepare('UPDATE giveaways SET message_id = ? WHERE id = ?').run(msg.id, gaId);

      return ctx.sendSuccess('Giveaway Started', `Giveaway for **${prize}** has begun in <#${channel.id}>!`);
    }

    // === DROP ===
    if (sub === 'drop') {
      const prize = ctx.isSlash ? ctx.raw.options.getString('prize') : args[1];
      const winnersCount = ctx.isSlash ? (ctx.raw.options.getInteger('winners') || 1) : (parseInt(args[2]) || 1);
      const channel = ctx.isSlash ? (ctx.raw.options.getChannel('channel') || ctx.channel) : ctx.channel;

      if (!prize) return ctx.sendError('Missing Prize', 'Please specify a prize.');

      const dropEmbed = new RotiEmbed()
        .setTitle(`⚡ QUICK DROP: ${prize}`)
        .setDescription(`First **${winnersCount}** person(s) to click the button win instantly!`)
        .setColor(botConfig.colors.warning);

      const res = ctx.client.db.prepare(`
        INSERT INTO giveaways (guild_id, channel_id, prize, winner_count, host_id, end_time, status)
        VALUES (?, ?, ?, ?, ?, ?, "active")
      `).run(guild.id, channel.id, prize, winnersCount, ctx.user.id, Date.now() + 86400000);

      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId(`ga_enter:${res.lastInsertRowid}`).setLabel('Claim Drop!').setEmoji('⚡').setStyle(ButtonStyle.Danger)
      );

      const msg = await channel.send({ embeds: [dropEmbed], components: [row] });
      ctx.client.db.prepare('UPDATE giveaways SET message_id = ? WHERE id = ?').run(msg.id, res.lastInsertRowid);

      return ctx.sendSuccess('Drop Launched', `Quick drop launched in <#${channel.id}>!`);
    }

    // === END ===
    if (sub === 'end') {
      const msgId = ctx.isSlash ? ctx.raw.options.getString('message_id') : args[1];
      const ga = ctx.client.db.prepare('SELECT * FROM giveaways WHERE guild_id = ? AND message_id = ?').get(guild.id, msgId);
      if (!ga) return ctx.sendError('Not Found', 'Giveaway message ID not found.');

      await endGiveaway(ctx.client, ga);
      return ctx.sendSuccess('Giveaway Ended', 'Giveaway concluded and winners selected.');
    }

    // === REROLL ===
    if (sub === 'reroll') {
      const msgId = ctx.isSlash ? ctx.raw.options.getString('message_id') : args[1];
      const ga = ctx.client.db.prepare('SELECT * FROM giveaways WHERE guild_id = ? AND message_id = ?').get(guild.id, msgId);
      if (!ga) return ctx.sendError('Not Found', 'Giveaway message ID not found.');

      const entries = JSON.parse(ga.entries || '[]');
      if (entries.length === 0) return ctx.sendError('No Entries', 'Cannot reroll a giveaway with no participants.');

      const newWinner = entries[Math.floor(Math.random() * entries.length)];
      return ctx.reply({ content: `🎉 **New Winner Rerolled:** Congratulations <@${newWinner}>! You won **${ga.prize}**!` });
    }

    // === DELETE ===
    if (sub === 'delete') {
      const msgId = ctx.isSlash ? ctx.raw.options.getString('message_id') : args[1];
      ctx.client.db.prepare('DELETE FROM giveaways WHERE guild_id = ? AND message_id = ?').run(guild.id, msgId);
      return ctx.sendSuccess('Giveaway Deleted', `Giveaway \`${msgId}\` removed.`);
    }

    // === LIST ===
    if (sub === 'list') {
      const activeGas = ctx.client.db.prepare("SELECT * FROM giveaways WHERE guild_id = ? AND status = 'active'").all(guild.id);
      if (activeGas.length === 0) return ctx.reply({ embeds: [RotiEmbed.info('Giveaways', 'No active giveaways on this server.')] });

      const list = activeGas.map(g => `**${g.prize}** in <#${g.channel_id}>\nEnds: <t:${Math.floor(g.end_time / 1000)}:R> • Winners: ${g.winner_count} • [Message](https://discord.com/channels/${guild.id}/${g.channel_id}/${g.message_id})`).join('\n\n');

      const embed = new RotiEmbed()
        .setTitle(`🎉 Active Giveaways (${activeGas.length})`)
        .setDescription(list)
        .setColor(botConfig.colors.teal);
      return ctx.reply({ embeds: [embed] });
    }
  }
}

module.exports = GiveawayCommand;
