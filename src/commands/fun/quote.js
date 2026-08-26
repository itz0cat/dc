const { SlashCommandBuilder } = require('discord.js');
const Command = require('../Command.js');
const RotiEmbed = require('../../utils/embed.js');
const botConfig = require('../../config.js');

class QuoteCommand extends Command {
  constructor() {
    super({
      name: 'quote',
      description: 'Quote a previous message by message ID',
      category: 'Fun',
      usage: 'quote <message_id>',
      slashData: new SlashCommandBuilder()
        .setName('quote')
        .setDescription('Quote a message by ID')
        .addStringOption(opt => opt.setName('message_id').setDescription('Message ID').setRequired(true))
    });
  }

  async execute(ctx, args) {
    const msgId = ctx.isSlash ? ctx.raw.options.getString('message_id') : args[0];
    if (!msgId) return ctx.sendError('Missing Message ID', 'Please provide a message ID.');

    const targetMsg = await ctx.channel.messages.fetch(msgId).catch(() => null);
    if (!targetMsg) return ctx.sendError('Message Not Found', 'Could not find that message in this channel.');

    const embed = new RotiEmbed()
      .setAuthor({ name: targetMsg.author.tag, iconURL: targetMsg.author.displayAvatarURL() })
      .setDescription(targetMsg.content || '*[Embed / Media]*')
      .addFields({ name: 'Jump to Message', value: `[Click Here](${targetMsg.url})` })
      .setColor(botConfig.colors.teal);

    if (targetMsg.attachments.first()) {
      embed.setImage(targetMsg.attachments.first().proxyURL);
    }

    return ctx.reply({ embeds: [embed] });
  }
}

module.exports = QuoteCommand;
