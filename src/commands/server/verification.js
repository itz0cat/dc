const { SlashCommandBuilder, PermissionFlagsBits, ChannelType, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const Command = require('../Command.js');
const RotiEmbed = require('../../utils/embed.js');
const botConfig = require('../../config.js');

class VerificationCommand extends Command {
  constructor() {
    super({
      name: 'verification',
      description: 'Configure interactive button verification gateway to protect the server from bot raids',
      category: 'Server',
      aliases: ['verifygate', 'verifyconfig'],
      usage: 'verification <setup/disable/view> [channel] [role]',
      userPermissions: [PermissionFlagsBits.ManageGuild],
      botPermissions: [PermissionFlagsBits.ManageRoles],
      slashData: new SlashCommandBuilder()
        .setName('verification')
        .setDescription('Configure server member verification')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
        .addSubcommand(sub => sub.setName('setup').setDescription('Setup interactive verification gate').addChannelOption(opt => opt.setName('channel').setDescription('Channel to post verification embed').addChannelTypes(ChannelType.GuildText).setRequired(true)).addRoleOption(opt => opt.setName('role').setDescription('Role to grant upon verification').setRequired(true)))
        .addSubcommand(sub => sub.setName('disable').setDescription('Disable verification system'))
        .addSubcommand(sub => sub.setName('view').setDescription('View current verification config'))
    });
  }

  async execute(ctx, args) {
    const sub = ctx.isSlash ? ctx.raw.options.getSubcommand() : (args[0]?.toLowerCase() || 'view');
    const guild = ctx.guild;

    if (sub === 'setup') {
      const channel = ctx.isSlash ? ctx.raw.options.getChannel('channel') : (ctx.raw.mentions.channels.first() || ctx.channel);
      const role = ctx.isSlash ? ctx.raw.options.getRole('role') : (guild.roles.cache.get(args[2]?.replace(/<@&|>/g, '')));

      if (!channel || !role) return ctx.sendError('Invalid Usage', 'Usage: `?verification setup <#channel> <@role>`');

      const verifyEmbed = new RotiEmbed()
        .setTitle(`🛡️ Verification Required: ${guild.name}`)
        .setDescription(`Welcome to **${guild.name}**!\n\nTo gain access to the rest of the server and chat channels, please click the **Verify** button below to complete verification.`)
        .setThumbnail(guild.iconURL())
        .setColor(botConfig.colors.teal);

      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId('falcon_verify_btn')
          .setLabel('Verify')
          .setStyle(ButtonStyle.Success)
          .setEmoji('✅')
      );

      const msg = await channel.send({ embeds: [verifyEmbed], components: [row] });

      ctx.client.db.prepare(`
        INSERT OR REPLACE INTO verification_configs (guild_id, channel_id, role_id, message_id, type)
        VALUES (?, ?, ?, ?, 'button')
      `).run(guild.id, channel.id, role.id, msg.id);

      return ctx.sendSuccess('Verification Setup Complete', `✅ Verification gate posted in <#${channel.id}>! Members will receive <@&${role.id}> upon clicking Verify.`);
    }

    if (sub === 'disable') {
      ctx.client.db.prepare('DELETE FROM verification_configs WHERE guild_id = ?').run(guild.id);
      return ctx.sendSuccess('Verification Disabled', 'Verification system has been disabled.');
    }

    if (sub === 'view') {
      const config = ctx.client.db.prepare('SELECT * FROM verification_configs WHERE guild_id = ?').get(guild.id);
      if (!config) return ctx.reply({ embeds: [RotiEmbed.info('Verification Config', 'No verification system configured.')] });

      const embed = new RotiEmbed()
        .setTitle(`🛡️ Verification Gate: ${guild.name}`)
        .setDescription(`**Channel:** <#${config.channel_id}>\n**Verified Role:** <@&${config.role_id}>\n**Gate Type:** \`${config.type.toUpperCase()}\``)
        .setColor(botConfig.colors.teal);

      return ctx.reply({ embeds: [embed] });
    }
  }
}

module.exports = VerificationCommand;
