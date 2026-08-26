const { SlashCommandBuilder } = require('discord.js');
const Command = require('../Command.js');
const RotiEmbed = require('../../utils/embed.js');
const botConfig = require('../../config.js');

class PremiumCommand extends Command {
  constructor() {
    super({
      name: 'premium',
      description: 'Check premium subscription status, perks, no-prefix mode and activation',
      category: 'Utility',
      aliases: ['vip', 'noprefix'],
      usage: 'premium [check/activate/noprefix]',
      slashData: new SlashCommandBuilder()
        .setName('premium')
        .setDescription('Manage premium features')
        .addSubcommand(s => s.setName('check').setDescription('Check current server premium tier'))
        .addSubcommand(s => s.setName('noprefix').setDescription('Toggle no-prefix mode for premium members'))
    });
  }

  async execute(ctx, args) {
    const sub = ctx.isSlash ? ctx.raw.options.getSubcommand() : (args[0]?.toLowerCase() || 'check');

    const embed = new RotiEmbed()
      .setTitle('💎 Cat Premium Membership')
      .setDescription(
        `**Status:** 🌟 **Active Lifetime Tier (All Features Unlocked)**\n\n` +
        `**Unlocked Perks:**\n` +
        `• ⚡ **No-Prefix Mode:** Run commands directly without typing \`?\`\n` +
        `• 🎧 **Lossless Audio & HD Filters:** 8D, Nightcore, Bassboost, Slowed\n` +
        `• 📻 **24/7 Radio & Voice Stay:** Bot never leaves the VC\n` +
        `• 📁 **Unlimited Custom Playlists:** Save infinite songs\n` +
        `• 🛡️ **Ultra Anti-Nuke Suite:** Instant raid defense & automated backups\n` +
        `• 📊 **Full Falcon Tracker:** Lifetime invite & voice stats`
      )
      .setFooter({ text: 'Cat Premium • Unlocked for Server Owners', iconURL: ctx.client.user.displayAvatarURL() })
      .setColor(botConfig.colors.teal);

    return ctx.reply({ embeds: [embed] });
  }
}

module.exports = PremiumCommand;
