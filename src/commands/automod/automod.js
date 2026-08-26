const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const Command = require('../Command.js');
const RotiEmbed = require('../../utils/embed.js');
const botConfig = require('../../config.js');

class AutomodCommand extends Command {
  constructor() {
    super({
      name: 'automod',
      description: 'Configure and toggle automated moderation protection modules',
      category: 'Automod',
      usage: 'automod <feature> <on/off>',
      userPermissions: [PermissionFlagsBits.ManageGuild],
      slashData: new SlashCommandBuilder()
        .setName('automod')
        .setDescription('Configure automated moderation features')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
        .addStringOption(opt => opt.setName('feature').setDescription('AutoMod feature to toggle').addChoices(
          { name: 'Anti-Invite Links', value: 'anti_invites' },
          { name: 'Anti-Links (All Links)', value: 'anti_links' },
          { name: 'Anti-Spam / Fast Messages', value: 'anti_spam' },
          { name: 'Anti-Excessive Caps', value: 'anti_caps' },
          { name: 'Anti-Mass Mention (5+)', value: 'anti_massmention' }
        ))
        .addStringOption(opt => opt.setName('state').setDescription('State').addChoices({ name: 'Enable (On)', value: 'on' }, { name: 'Disable (Off)', value: 'off' }))
    });
  }

  async execute(ctx, args) {
    const feature = ctx.isSlash ? ctx.raw.options.getString('feature') : args[0]?.toLowerCase();
    const state = ctx.isSlash ? ctx.raw.options.getString('state') : args[1]?.toLowerCase();
    const guild = ctx.guild;

    let am = ctx.client.db.prepare('SELECT * FROM automod WHERE guild_id = ?').get(guild.id);
    if (!am) {
      ctx.client.db.prepare('INSERT INTO automod (guild_id) VALUES (?)').run(guild.id);
      am = ctx.client.db.prepare('SELECT * FROM automod WHERE guild_id = ?').get(guild.id);
    }

    if (feature && state) {
      const validFeatures = ['anti_invites', 'anti_links', 'anti_spam', 'anti_caps', 'anti_massmention'];
      if (!validFeatures.includes(feature)) {
        return ctx.sendError('Invalid Feature', `Valid options: ${validFeatures.join(', ')}`);
      }

      const val = (state === 'on' || state === 'enable') ? 1 : 0;
      ctx.client.db.prepare(`UPDATE automod SET ${feature} = ? WHERE guild_id = ?`).run(val, guild.id);

      return ctx.sendSuccess('AutoMod Updated', `**${feature.replace(/_/g, ' ').toUpperCase()}** is now **${val ? 'ENABLED' : 'DISABLED'}**.`);
    }

    // Display Overview
    const updated = ctx.client.db.prepare('SELECT * FROM automod WHERE guild_id = ?').get(guild.id);
    const embed = new RotiEmbed()
      .setTitle('🛡️ AutoMod Protection Status')
      .setDescription('Automated moderation filters and protections active in this server:')
      .addFields(
        { name: '🔗 Anti-Invite Links', value: updated.anti_invites ? '✅ Enabled' : '❌ Disabled', inline: true },
        { name: '🌐 Anti-All Links', value: updated.anti_links ? '✅ Enabled' : '❌ Disabled', inline: true },
        { name: '⚡ Anti-Spam', value: updated.anti_spam ? '✅ Enabled' : '❌ Disabled', inline: true },
        { name: '🔤 Anti-Caps (>70%)', value: updated.anti_caps ? '✅ Enabled' : '❌ Disabled', inline: true },
        { name: '👥 Anti-Mass Mention', value: updated.anti_massmention ? '✅ Enabled' : '❌ Disabled', inline: true }
      )
      .setFooter({ text: 'Use /automod [feature] [on/off] to toggle filters' })
      .setColor(botConfig.colors.teal);

    return ctx.reply({ embeds: [embed] });
  }
}

module.exports = AutomodCommand;
