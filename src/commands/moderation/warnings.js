const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const Command = require('../Command.js');
const RotiEmbed = require('../../utils/embed.js');
const botConfig = require('../../config.js');

class WarningsCommand extends Command {
  constructor() {
    super({
      name: 'warnings',
      description: 'Display all warnings of a user',
      category: 'Moderation',
      aliases: ['warns'],
      usage: 'warnings <user>',
      userPermissions: [PermissionFlagsBits.ManageMessages],
      slashData: new SlashCommandBuilder()
        .setName('warnings')
        .setDescription('Display warnings of a user')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
        .addUserOption(opt => opt.setName('user').setDescription('User to check').setRequired(true))
    });
  }

  async execute(ctx, args) {
    const targetUser = ctx.isSlash ? ctx.raw.options.getUser('user') : (ctx.raw.mentions.users.first() || ctx.user);
    const warns = ctx.client.db.prepare('SELECT * FROM warnings WHERE guild_id = ? AND user_id = ? ORDER BY id DESC').all(ctx.guild.id, targetUser.id);

    if (warns.length === 0) {
      return ctx.reply({ embeds: [RotiEmbed.info('Clean Record', `<@${targetUser.id}> has **0** active warnings.`)] });
    }

    const list = warns.map(w => `**#${w.id}** • <t:${Math.floor(w.created_at / 1000)}:d> by <@${w.mod_id}>\nReason: *${w.reason}*`).join('\n\n');

    const embed = new RotiEmbed()
      .setTitle(`⚠️ Warnings for ${targetUser.tag} (${warns.length})`)
      .setDescription(list)
      .setColor(botConfig.colors.warning);

    return ctx.reply({ embeds: [embed] });
  }
}

module.exports = WarningsCommand;
