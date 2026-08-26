const { SlashCommandBuilder } = require('discord.js');
const Command = require('../Command.js');
const RotiEmbed = require('../../utils/embed.js');
const botConfig = require('../../config.js');

class InviterCommand extends Command {
  constructor() {
    super({
      name: 'inviter',
      description: 'Find out who invited a specific member to the server',
      category: 'Tracking',
      usage: 'inviter [user]',
      slashData: new SlashCommandBuilder()
        .setName('inviter')
        .setDescription('Find who invited a member')
        .addUserOption(opt => opt.setName('user').setDescription('Target member'))
    });
  }

  async execute(ctx, args) {
    const targetUser = ctx.isSlash ? (ctx.raw.options.getUser('user') || ctx.user) : (ctx.raw.mentions.users.first() || ctx.user);
    const guild = ctx.guild;

    const record = ctx.client.db.prepare('SELECT * FROM invite_members WHERE guild_id = ? AND user_id = ?').get(guild.id, targetUser.id);

    if (!record || !record.inviter_id) {
      return ctx.reply({
        embeds: [RotiEmbed.info('Inviter Info', `<@${targetUser.id}> joined before tracking started or used a vanity/custom URL.`)]
      });
    }

    const inviter = await ctx.client.users.fetch(record.inviter_id).catch(() => null);
    const joinDate = record.timestamp ? `<t:${Math.floor(record.timestamp / 1000)}:R>` : 'Unknown date';

    const embed = new RotiEmbed()
      .setTitle('🔍 Inviter Lookup')
      .setDescription(`<@${targetUser.id}> was invited by <@${record.inviter_id}> (${inviter ? inviter.tag : 'Unknown'})\n**Invite Code:** \`${record.code || 'Unknown'}\`\n**Joined:** ${joinDate}`)
      .setColor(botConfig.colors.teal);

    return ctx.reply({ embeds: [embed] });
  }
}

module.exports = InviterCommand;
