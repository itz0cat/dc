const { SlashCommandBuilder } = require('discord.js');
const Command = require('../Command.js');
const RotiEmbed = require('../../utils/embed.js');
const botConfig = require('../../config.js');

class CaptchaCommand extends Command {
  constructor() {
    super({
      name: 'captcha',
      description: 'Test your typing speed and accuracy by solving a randomized captcha challenge',
      category: 'Fun',
      usage: 'captcha',
      slashData: new SlashCommandBuilder()
        .setName('captcha')
        .setDescription('Solve a captcha challenge')
    });
  }

  async execute(ctx) {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }

    const embed = new RotiEmbed()
      .setTitle('🧩 Captcha Challenge')
      .setDescription(`Type the following 6-character code in chat within **15 seconds**:\n\n# \`${code}\``)
      .setColor(botConfig.colors.teal);

    await ctx.reply({ embeds: [embed] });

    const filter = m => m.author.id === ctx.user.id;
    const collected = await ctx.channel.awaitMessages({ filter, max: 1, time: 15000, errors: ['time'] }).catch(() => null);

    if (!collected || collected.size === 0) {
      return ctx.channel.send({ content: `⏰ Time's up <@${ctx.user.id}>! The captcha expired.` });
    }

    const replyMsg = collected.first();
    if (replyMsg.content.trim().toUpperCase() === code) {
      return replyMsg.reply({ content: `✅ **Success!** Captcha solved correctly in time!` });
    } else {
      return replyMsg.reply({ content: `❌ **Incorrect!** You typed \`${replyMsg.content}\`, correct code was \`${code}\`.` });
    }
  }
}

module.exports = CaptchaCommand;
