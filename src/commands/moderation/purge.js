const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const Command = require('../Command.js');
const RotiEmbed = require('../../utils/embed.js');
const botConfig = require('../../config.js');

class PurgeCommand extends Command {
  constructor() {
    super({
      name: 'purge',
      description: 'Delete a specified number of messages from a channel with optional filters',
      category: 'Moderation',
      aliases: ['clear', 'clean'],
      usage: 'purge <amount> [filter]',
      userPermissions: [PermissionFlagsBits.ManageMessages],
      botPermissions: [PermissionFlagsBits.ManageMessages],
      slashData: new SlashCommandBuilder()
        .setName('purge')
        .setDescription('Delete messages from a channel')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
        .addIntegerOption(opt => opt.setName('amount').setDescription('Number of messages to delete (1-100)').setMinValue(1).setMaxValue(100).setRequired(true))
        .addStringOption(opt => opt.setName('filter').setDescription('Filter type').addChoices(
          { name: 'Bots Only', value: 'bots' },
          { name: 'Links Only', value: 'links' },
          { name: 'Attachments / Images Only', value: 'media' },
          { name: 'User Mentions Only', value: 'mentions' }
        ))
        .addUserOption(opt => opt.setName('user').setDescription('Delete only from a specific user'))
    });
  }

  async execute(ctx, args) {
    const amount = ctx.isSlash ? ctx.raw.options.getInteger('amount') : parseInt(args[0]);
    if (!amount || isNaN(amount) || amount < 1 || amount > 100) {
      return ctx.sendError('Invalid Amount', 'Please provide a valid number of messages to delete between 1 and 100.');
    }

    const filter = ctx.isSlash ? ctx.raw.options.getString('filter') : args[1]?.toLowerCase();
    const targetUser = ctx.isSlash ? ctx.raw.options.getUser('user') : ctx.raw.mentions.users.first();

    // If prefix command, delete command message first
    if (!ctx.isSlash) {
      await ctx.raw.delete().catch(() => {});
    }

    let messages = await ctx.channel.messages.fetch({ limit: amount });

    if (targetUser) {
      messages = messages.filter(m => m.author.id === targetUser.id);
    } else if (filter === 'bots' || filter === 'bot') {
      messages = messages.filter(m => m.author.bot);
    } else if (filter === 'links' || filter === 'link') {
      messages = messages.filter(m => /(https?:\/\/[^\s]+)/i.test(m.content));
    } else if (filter === 'media' || filter === 'attachments') {
      messages = messages.filter(m => m.attachments.size > 0);
    }

    const deleted = await ctx.channel.bulkDelete(messages, true).catch(err => {
      return ctx.sendError('Purge Failed', `Messages older than 14 days cannot be bulk deleted: ${err.message}`);
    });

    const successMsg = `🗑️ Successfully deleted **${deleted?.size || 0}** message(s).`;
    if (ctx.isSlash) {
      return ctx.replyEphemeral({ content: successMsg });
    } else {
      return ctx.channel.send({ content: successMsg }).then(m => setTimeout(() => m.delete().catch(() => {}), 4000));
    }
  }
}

module.exports = PurgeCommand;
