const { SlashCommandBuilder } = require('discord.js');
const Command = require('../Command.js');
const RotiEmbed = require('../../utils/embed.js');
const botConfig = require('../../config.js');

class SaveCommand extends Command {
  constructor() {
    super({
      name: 'save',
      description: 'Send current playing song details to your private Direct Messages',
      category: 'Music',
      aliases: ['grab', 'dmtrack'],
      usage: 'save',
      slashData: new SlashCommandBuilder()
        .setName('save')
        .setDescription('Save song to DMs')
    });
  }

  async execute(ctx) {
    const queue = ctx.client.music.getQueue(ctx.guild.id);
    if (!queue || !queue.current) return ctx.sendError('Not Playing', 'No song is currently playing.');

    const song = queue.current;
    const embed = new RotiEmbed()
      .setTitle('💾 Saved Song from ' + ctx.guild.name)
      .setDescription(`[**${song.title}**](${song.url})`)
      .setThumbnail(song.thumbnail)
      .addFields(
        { name: 'Duration', value: `\`${song.durationStr || '3:30'}\``, inline: true },
        { name: 'Server', value: `\`${ctx.guild.name}\``, inline: true },
        { name: 'Played At', value: `<t:${Math.floor(Date.now() / 1000)}:R>`, inline: true }
      )
      .setColor(botConfig.colors.teal);

    try {
      await ctx.user.send({ embeds: [embed] });
      return ctx.replyEphemeral({ content: '📬 Sent current song info to your Direct Messages!' });
    } catch (e) {
      return ctx.sendError('DM Closed', 'I could not DM you. Please enable server DMs in your privacy settings.');
    }
  }
}

module.exports = SaveCommand;
