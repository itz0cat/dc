const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const Command = require('../Command.js');
const RotiEmbed = require('../../utils/embed.js');
const botConfig = require('../../config.js');

class InvitesCommand extends Command {
  constructor() {
    super({
      name: 'invites',
      description: 'Check your own or another member\'s invite count and breakdown',
      category: 'Tracking',
      aliases: ['invs', 'myinvites'],
      usage: 'invites [user] OR invites <add/remove/reset> <user> [amount]',
      slashData: new SlashCommandBuilder()
        .setName('invites')
        .setDescription('View or manage member invite statistics')
        .addUserOption(opt => opt.setName('user').setDescription('Target user to inspect'))
    });
  }

  async execute(ctx, args) {
    const sub = args[0]?.toLowerCase();
    const guild = ctx.guild;

    // Admin add bonus invites
    if (sub === 'add' && ctx.member.permissions.has(PermissionFlagsBits.ManageGuild)) {
      const target = ctx.raw.mentions.users.first() || await ctx.client.users.fetch(args[1]).catch(() => null);
      const amount = parseInt(args[2]);
      if (!target || isNaN(amount)) return ctx.sendError('Invalid Usage', 'Usage: `?invites add @user <amount>`');

      ctx.client.db.prepare(`
        INSERT INTO invites (guild_id, user_id, regular, fake, left, bonus)
        VALUES (?, ?, 0, 0, 0, ?)
        ON CONFLICT(guild_id, user_id) DO UPDATE SET bonus = bonus + ?
      `).run(guild.id, target.id, amount, amount);

      return ctx.sendSuccess('Bonus Invites Added', `Added **${amount}** bonus invites to <@${target.id}>!`);
    }

    // Admin remove bonus invites
    if (sub === 'remove' && ctx.member.permissions.has(PermissionFlagsBits.ManageGuild)) {
      const target = ctx.raw.mentions.users.first() || await ctx.client.users.fetch(args[1]).catch(() => null);
      const amount = parseInt(args[2]);
      if (!target || isNaN(amount)) return ctx.sendError('Invalid Usage', 'Usage: `?invites remove @user <amount>`');

      ctx.client.db.prepare(`
        INSERT INTO invites (guild_id, user_id, regular, fake, left, bonus)
        VALUES (?, ?, 0, 0, 0, -?)
        ON CONFLICT(guild_id, user_id) DO UPDATE SET bonus = bonus - ?
      `).run(guild.id, target.id, amount, amount);

      return ctx.sendSuccess('Bonus Invites Removed', `Removed **${amount}** bonus invites from <@${target.id}>.`);
    }

    // Standard Invites Lookup
    const targetUser = ctx.isSlash ? (ctx.raw.options.getUser('user') || ctx.user) : (ctx.raw.mentions.users.first() || ctx.user);
    const data = ctx.client.db.prepare('SELECT * FROM invites WHERE guild_id = ? AND user_id = ?').get(guild.id, targetUser.id) || {
      regular: 0,
      fake: 0,
      left: 0,
      bonus: 0
    };

    const total = data.regular + data.bonus - data.left - data.fake;

    const embed = new RotiEmbed()
      .setTitle(`✉️ Invite Statistics: ${targetUser.username}`)
      .setDescription(`<@${targetUser.id}> currently has **${total}** net invites!`)
      .setThumbnail(targetUser.displayAvatarURL())
      .addFields(
        { name: '✅ Regular', value: `\`${data.regular}\``, inline: true },
        { name: '✨ Bonus', value: `\`${data.bonus}\``, inline: true },
        { name: '❌ Leaves', value: `\`${data.left}\``, inline: true },
        { name: '⚠️ Fake', value: `\`${data.fake}\``, inline: true },
        { name: '📊 Total Net', value: `\`${total}\``, inline: true }
      )
      .setColor(botConfig.colors.teal);

    return ctx.reply({ embeds: [embed] });
  }
}

module.exports = InvitesCommand;
