const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const Command = require('../Command.js');
const RotiEmbed = require('../../utils/embed.js');
const botConfig = require('../../config.js');

class ModlogsCommand extends Command {
  constructor() {
    super({
      name: 'modlogs',
      description: 'Display moderation history logs for a specific user',
      category: 'Moderation',
      aliases: ['history', 'infractions'],
      usage: 'modlogs <user>',
      userPermissions: [PermissionFlagsBits.ManageMessages],
      slashData: new SlashCommandBuilder()
        .setName('modlogs')
        .setDescription('Displays moderation logs for a user')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
        .addUserOption(opt => opt.setName('user').setDescription('User to inspect').setRequired(true))
    });
  }

  async execute(ctx, args) {
    const targetUser = ctx.isSlash ? ctx.raw.options.getUser('user') : (ctx.raw.mentions.users.first() || ctx.user);
    const logs = ctx.client.db.prepare('SELECT * FROM modlogs WHERE guild_id = ? AND user_id = ? ORDER BY case_id DESC LIMIT 15').all(ctx.guild.id, targetUser.id);

    if (logs.length === 0) {
      return ctx.reply({ embeds: [RotiEmbed.info('No History', `<@${targetUser.id}> (${targetUser.tag}) has no moderation infractions.`)] });
    }

    const list = logs.map(l => `**Case #${l.case_id}** • \`${l.action.toUpperCase()}\` (<t:${Math.floor(l.created_at / 1000)}:d>) by <@${l.mod_id}>\nReason: *${l.reason}*`).join('\n\n');

    const embed = new RotiEmbed()
      .setTitle(`🛡️ Mod Logs for ${targetUser.tag} (${logs.length})`)
      .setDescription(list)
      .setColor(botConfig.colors.teal);

    return ctx.reply({ embeds: [embed] });
  }
}

module.exports = ModlogsCommand;
