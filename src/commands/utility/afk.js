const { SlashCommandBuilder } = require('discord.js');
const Command = require('../Command.js');
const RotiEmbed = require('../../utils/embed.js');
const botConfig = require('../../config.js');
const { formatDuration } = require('../../utils/time.js');

class AfkCommand extends Command {
  constructor() {
    super({
      name: 'afk',
      description: 'Set your AFK status or view all AFK members in the server',
      category: 'Utility',
      usage: 'afk <set/clear/list/reset> [reason/user]',
      slashData: new SlashCommandBuilder()
        .setName('afk')
        .setDescription('Manage AFK status')
        .addSubcommand(sub => sub.setName('set').setDescription('Set your AFK status').addStringOption(opt => opt.setName('reason').setDescription('AFK reason')))
        .addSubcommand(sub => sub.setName('clear').setDescription('Clear AFK status').addUserOption(opt => opt.setName('user').setDescription('User to clear AFK for')))
        .addSubcommand(sub => sub.setName('list').setDescription('List all AFK members in server'))
    });
  }

  async execute(ctx, args) {
    const isDirectSet = !['set', 'clear', 'list', 'reset'].includes(args[0]?.toLowerCase());
    const sub = ctx.isSlash ? ctx.raw.options.getSubcommand() : (isDirectSet ? 'set' : args[0]?.toLowerCase());
    const guild = ctx.guild;

    if (sub === 'set') {
      const reason = ctx.isSlash ? (ctx.raw.options.getString('reason') || 'AFK') : (isDirectSet ? (args.join(' ') || 'AFK') : (args.slice(1).join(' ') || 'AFK'));

      ctx.client.db.prepare(`
        INSERT OR REPLACE INTO afk (guild_id, user_id, reason, timestamp)
        VALUES (?, ?, ?, ?)
      `).run(guild.id, ctx.user.id, reason, Date.now());

      const embed = new RotiEmbed()
        .setTitle('💤 AFK Status Set')
        .setDescription(`I have set your status to AFK:\n*"${reason}"*\n\nI will notify anyone who mentions you and automatically remove your AFK when you send a message.`)
        .setColor(botConfig.colors.teal);

      return ctx.reply({ embeds: [embed] });
    }

    if (sub === 'clear' || sub === 'reset') {
      const targetUser = ctx.isSlash ? (ctx.raw.options.getUser('user') || ctx.user) : (ctx.raw.mentions.users.first() || ctx.user);
      ctx.client.db.prepare('DELETE FROM afk WHERE guild_id = ? AND user_id = ?').run(guild.id, targetUser.id);
      return ctx.sendSuccess('AFK Cleared', `AFK status removed for <@${targetUser.id}>.`);
    }

    if (sub === 'list') {
      const afkList = ctx.client.db.prepare('SELECT * FROM afk WHERE guild_id = ?').all(guild.id);
      if (afkList.length === 0) {
        return ctx.reply({ embeds: [RotiEmbed.info('AFK List', 'There are no AFK members currently in this server.')] });
      }

      const list = afkList.map(a => `<@${a.user_id}>: *${a.reason}* (${formatDuration(Date.now() - a.timestamp)} ago)`).join('\n');
      const embed = new RotiEmbed()
        .setTitle(`💤 AFK Members (${afkList.length})`)
        .setDescription(list)
        .setColor(botConfig.colors.teal);

      return ctx.reply({ embeds: [embed] });
    }
  }
}

module.exports = AfkCommand;
