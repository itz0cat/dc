const { SlashCommandBuilder } = require('discord.js');
const Command = require('../Command.js');
const RotiEmbed = require('../../utils/embed.js');
const botConfig = require('../../config.js');

class PollCommand extends Command {
  constructor() {
    super({
      name: 'poll',
      description: 'Create a community poll with emoji reaction options',
      category: 'Fun',
      usage: 'poll <question> | [opt1] | [opt2] ...',
      slashData: new SlashCommandBuilder()
        .setName('poll')
        .setDescription('Create a community poll')
        .addStringOption(opt => opt.setName('question').setDescription('Poll question').setRequired(true))
        .addStringOption(opt => opt.setName('options').setDescription('Poll options separated by | (e.g. Yes | No | Maybe)'))
    });
  }

  async execute(ctx, args) {
    const question = ctx.isSlash ? ctx.raw.options.getString('question') : args.join(' ').split('|')[0]?.trim();
    const rawOptions = ctx.isSlash ? ctx.raw.options.getString('options') : args.join(' ').split('|').slice(1).join('|');

    if (!question) return ctx.sendError('Missing Question', 'Please provide a poll question.');

    const emojis = ['1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣', '🔟'];
    let options = [];

    if (rawOptions) {
      options = rawOptions.split('|').map(o => o.trim()).filter(Boolean);
    }

    if (options.length > 10) {
      return ctx.sendError('Too Many Options', 'Maximum 10 options allowed in a poll.');
    }

    const embed = new RotiEmbed()
      .setTitle(`📊 Poll: ${question}`)
      .setFooter({ text: `Poll started by ${ctx.user.tag} • ${botConfig.footerText}` })
      .setColor(botConfig.colors.teal);

    if (options.length > 0) {
      const description = options.map((opt, i) => `${emojis[i]} **${opt}**`).join('\n\n');
      embed.setDescription(description);
    } else {
      embed.setDescription('👍 **Yes**\n👎 **No**');
    }

    let pollMsg;
    if (ctx.isSlash) {
      pollMsg = await ctx.channel.send({ embeds: [embed] });
      await ctx.replyEphemeral({ content: '✅ Poll created!' });
    } else {
      pollMsg = await ctx.channel.send({ embeds: [embed] });
    }

    if (options.length > 0) {
      for (let i = 0; i < options.length; i++) {
        await pollMsg.react(emojis[i]).catch(() => {});
      }
    } else {
      await pollMsg.react('👍').catch(() => {});
      await pollMsg.react('👎').catch(() => {});
    }
  }
}

module.exports = PollCommand;
