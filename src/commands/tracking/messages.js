const { SlashCommandBuilder } = require('discord.js');
const Command = require('../Command.js');
const RotiEmbed = require('../../utils/embed.js');
const botConfig = require('../../config.js');

class MessagesCommand extends Command {
  constructor() {
    super({
      name: 'messages',
      description: 'Check your own or another member\'s chat message statistics',
      category: 'Tracking',
      aliases: ['msgs', 'mymessages'],
      usage: 'messages [user]',
      slashData: new SlashCommandBuilder()
        .setName('messages')
        .setDescription('View member message activity statistics')
        .addUserOption(opt => opt.setName('user').setDescription('Target user to inspect'))
    });
  }

  async execute(ctx, args) {
    const targetUser = ctx.isSlash ? (ctx.raw.options.getUser('user') || ctx.user) : (ctx.raw.mentions.users.first() || ctx.user);
    const guild = ctx.guild;

    const data = ctx.client.db.prepare('SELECT * FROM message_stats WHERE guild_id = ? AND user_id = ?').get(guild.id, targetUser.id) || {
      daily_count: 0,
      weekly_count: 0,
      total_count: 0,
      last_message: 0
    };

    const embed = new RotiEmbed()
      .setTitle(`💬 Message Statistics: ${targetUser.username}`)
      .setDescription(`<@${targetUser.id}> has sent **${data.total_count.toLocaleString()}** messages in **${guild.name}**!`)
      .setThumbnail(targetUser.displayAvatarURL())
      .addFields(
        { name: '📅 Daily Messages', value: `\`${data.daily_count.toLocaleString()}\``, inline: true },
        { name: '📊 Weekly Messages', value: `\`${data.weekly_count.toLocaleString()}\``, inline: true },
        { name: '🔥 Total Messages', value: `\`${data.total_count.toLocaleString()}\``, inline: true },
        { name: '⏱️ Last Active', value: data.last_message ? `<t:${Math.floor(data.last_message / 1000)}:R>` : '*Never*', inline: true }
      )
      .setColor(botConfig.colors.teal);

    return ctx.reply({ embeds: [embed] });
  }
}

module.exports = MessagesCommand;
