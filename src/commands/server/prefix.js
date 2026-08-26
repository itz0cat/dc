const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const Command = require('../Command.js');
const RotiEmbed = require('../../utils/embed.js');
const botConfig = require('../../config.js');

class PrefixCommand extends Command {
  constructor() {
    super({
      name: 'prefix',
      description: 'Manage or customize the server command prefix',
      category: 'Server',
      aliases: ['setprefix'],
      usage: 'prefix <add/remove/list/set> [prefix]',
      userPermissions: [PermissionFlagsBits.ManageGuild],
      slashData: new SlashCommandBuilder()
        .setName('prefix')
        .setDescription('Customize server prefix')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
        .addSubcommand(sub => sub.setName('set').setDescription('Set a new custom prefix').addStringOption(opt => opt.setName('prefix').setDescription('The new prefix').setRequired(true)))
        .addSubcommand(sub => sub.setName('list').setDescription('List current prefix'))
        .addSubcommand(sub => sub.setName('remove').setDescription('Reset prefix to default (r!)'))
    });
  }

  async execute(ctx, args) {
    const sub = ctx.isSlash ? ctx.raw.options.getSubcommand() : (args[0]?.toLowerCase() || 'list');
    const newPrefix = ctx.isSlash ? ctx.raw.options.getString('prefix') : (sub === 'set' ? args[1] : (sub !== 'list' && sub !== 'remove' ? args[0] : null));

    if (sub === 'set' || (newPrefix && sub !== 'list' && sub !== 'remove')) {
      if (newPrefix.length > 5) {
        return ctx.sendError('Invalid Prefix', 'Prefix cannot exceed 5 characters.');
      }
      ctx.client.db.updateGuild(ctx.guild.id, 'prefix', newPrefix);
      return ctx.sendSuccess('Prefix Updated', `Server prefix has been changed to \`${newPrefix}\`\nExample: \`${newPrefix}help\``);
    } else if (sub === 'remove' || sub === 'reset') {
      ctx.client.db.updateGuild(ctx.guild.id, 'prefix', botConfig.defaultPrefix);
      return ctx.sendSuccess('Prefix Reset', `Prefix reset to default: \`${botConfig.defaultPrefix}\``);
    } else {
      const current = ctx.client.db.getPrefix(ctx.guild.id);
      const embed = new RotiEmbed()
        .setTitle('⚙️ Server Prefix')
        .setDescription(`Current prefix for this server: \`${current}\`\nDefault prefix: \`${botConfig.defaultPrefix}\`\nYou can also always mention me: <@${ctx.client.user.id}>`)
        .setColor(botConfig.colors.teal);
      return ctx.reply({ embeds: [embed] });
    }
  }
}

module.exports = PrefixCommand;
