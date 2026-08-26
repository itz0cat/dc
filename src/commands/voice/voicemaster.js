const { SlashCommandBuilder, PermissionFlagsBits, ChannelType, PermissionsBitField } = require('discord.js');
const Command = require('../Command.js');
const RotiEmbed = require('../../utils/embed.js');
const botConfig = require('../../config.js');

class VoiceMasterCommand extends Command {
  constructor() {
    super({
      name: 'voicemaster',
      description: 'Manage and configure temporary voice channels (Join to Create)',
      category: 'Voice',
      aliases: ['vm', 'tempvoice'],
      usage: 'voicemaster <setup/lock/unlock/name/limit/permit/reject/claim>',
      slashData: new SlashCommandBuilder()
        .setName('voicemaster')
        .setDescription('Temporary voice channel management')
        .addSubcommand(sub => sub.setName('setup').setDescription('Setup VoiceMaster Join-to-Create system'))
        .addSubcommand(sub => sub.setName('lock').setDescription('Lock your temporary voice channel'))
        .addSubcommand(sub => sub.setName('unlock').setDescription('Unlock your temporary voice channel'))
        .addSubcommand(sub => sub.setName('name').setDescription('Rename your voice channel').addStringOption(opt => opt.setName('name').setDescription('New channel name').setRequired(true)))
        .addSubcommand(sub => sub.setName('limit').setDescription('Set user limit').addIntegerOption(opt => opt.setName('limit').setDescription('User limit (0-99)').setMinValue(0).setMaxValue(99).setRequired(true)))
        .addSubcommand(sub => sub.setName('permit').setDescription('Permit a user into your voice channel').addUserOption(opt => opt.setName('user').setDescription('User to permit').setRequired(true)))
        .addSubcommand(sub => sub.setName('reject').setDescription('Reject and kick a user from your channel').addUserOption(opt => opt.setName('user').setDescription('User to kick').setRequired(true)))
        .addSubcommand(sub => sub.setName('claim').setDescription('Claim ownership of an abandoned temp channel'))
    });
  }

  async execute(ctx, args) {
    const sub = ctx.isSlash ? ctx.raw.options.getSubcommand() : (args[0]?.toLowerCase() || 'setup');
    const guild = ctx.guild;

    // === SETUP ===
    if (sub === 'setup') {
      if (!ctx.member.permissions.has(PermissionFlagsBits.ManageGuild)) {
        return ctx.sendError('Permission Denied', 'You need Manage Server permission to setup VoiceMaster.');
      }

      await ctx.defer();
      try {
        const category = await guild.channels.create({
          name: '🔊 Voice Channels',
          type: ChannelType.GuildCategory
        });

        const hub = await guild.channels.create({
          name: '➕ Join to Create',
          type: ChannelType.GuildVoice,
          parent: category.id
        });

        ctx.client.db.prepare(`
          INSERT OR REPLACE INTO voice_master_configs (guild_id, category_id, hub_channel_id, default_limit)
          VALUES (?, ?, ?, 0)
        `).run(guild.id, category.id, hub.id);

        const embed = new RotiEmbed()
          .setTitle('🔊 VoiceMaster Configured')
          .setDescription(`Successfully created VoiceMaster system!\n\n**Category:** <#${category.id}>\n**Hub Channel:** <#${hub.id}>\n\n*Members can now join <#${hub.id}> to automatically receive their own custom private voice channel!*`)
          .setColor(botConfig.colors.success);

        return ctx.reply({ embeds: [embed] });
      } catch (err) {
        return ctx.sendError('Setup Error', `Failed to create channels: ${err.message}`);
      }
    }

    // Must be in a voice channel for channel controls
    const voiceChannel = ctx.member.voice.channel;
    if (!voiceChannel) {
      return ctx.sendError('Not in Voice', 'You must be connected to your temporary voice channel to use this command.');
    }

    const tempRecord = ctx.client.db.prepare('SELECT * FROM temp_voice_channels WHERE channel_id = ?').get(voiceChannel.id);
    if (!tempRecord) {
      return ctx.sendError('Not a Temp Channel', 'This is not a recognized temporary voice channel.');
    }

    // === CLAIM ===
    if (sub === 'claim') {
      const isOwnerStillInChannel = voiceChannel.members.has(tempRecord.owner_id);
      if (isOwnerStillInChannel) {
        return ctx.sendError('Cannot Claim', `The channel owner (<@${tempRecord.owner_id}>) is still currently in the channel.`);
      }

      ctx.client.db.prepare('UPDATE temp_voice_channels SET owner_id = ? WHERE channel_id = ?').run(ctx.user.id, voiceChannel.id);
      return ctx.sendSuccess('Channel Claimed', `👑 You are now the owner of **${voiceChannel.name}**!`);
    }

    // Require channel owner for remaining actions
    if (tempRecord.owner_id !== ctx.user.id && !ctx.member.permissions.has(PermissionFlagsBits.ManageChannels)) {
      return ctx.sendError('Not Channel Owner', `Only the channel owner (<@${tempRecord.owner_id}>) can modify channel settings.`);
    }

    // === LOCK ===
    if (sub === 'lock') {
      await voiceChannel.permissionOverwrites.edit(guild.id, { Connect: false });
      return ctx.sendSuccess('Channel Locked', `🔒 **${voiceChannel.name}** is now locked! Other members cannot join.`);
    }

    // === UNLOCK ===
    if (sub === 'unlock') {
      await voiceChannel.permissionOverwrites.edit(guild.id, { Connect: null });
      return ctx.sendSuccess('Channel Unlocked', `🔓 **${voiceChannel.name}** is now unlocked!`);
    }

    // === NAME ===
    if (sub === 'name') {
      const newName = ctx.isSlash ? ctx.raw.options.getString('name') : args.slice(1).join(' ');
      if (!newName) return ctx.sendError('Missing Name', 'Please specify a new channel name.');

      await voiceChannel.setName(newName.slice(0, 100));
      return ctx.sendSuccess('Channel Renamed', `📝 Renamed voice channel to **${newName}**!`);
    }

    // === LIMIT ===
    if (sub === 'limit') {
      const limit = ctx.isSlash ? ctx.raw.options.getInteger('limit') : parseInt(args[1]);
      if (isNaN(limit) || limit < 0 || limit > 99) return ctx.sendError('Invalid Limit', 'Limit must be between 0 and 99.');

      await voiceChannel.setUserLimit(limit);
      return ctx.sendSuccess('User Limit Updated', `👥 User limit set to **${limit === 0 ? 'Unlimited' : limit}**.`);
    }

    // === PERMIT ===
    if (sub === 'permit') {
      const target = ctx.isSlash ? ctx.raw.options.getUser('user') : ctx.raw.mentions.users.first();
      if (!target) return ctx.sendError('Missing User', 'Please mention a user to permit.');

      await voiceChannel.permissionOverwrites.edit(target.id, { Connect: true, ViewChannel: true });
      return ctx.sendSuccess('User Permitted', `✅ <@${target.id}> has been granted access to join your channel.`);
    }

    // === REJECT ===
    if (sub === 'reject') {
      const target = ctx.isSlash ? ctx.raw.options.getUser('user') : ctx.raw.mentions.users.first();
      if (!target) return ctx.sendError('Missing User', 'Please mention a user to kick.');

      await voiceChannel.permissionOverwrites.edit(target.id, { Connect: false });
      const targetMember = voiceChannel.members.get(target.id);
      if (targetMember) {
        await targetMember.voice.disconnect('VoiceMaster: Rejected by owner').catch(() => {});
      }
      return ctx.sendSuccess('User Rejected', `🚫 <@${target.id}> was kicked from your channel and blocked from rejoining.`);
    }
  }
}

module.exports = VoiceMasterCommand;
