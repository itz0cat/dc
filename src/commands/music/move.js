const { SlashCommandBuilder, PermissionsBitField } = require('discord.js');
const Command = require('../Command.js');

class MoveCommand extends Command {
  constructor() {
    super({
      name: 'move',
      description: 'Move a song position in the queue or move bot to another voice channel',
      category: 'Music',
      aliases: ['movebot', 'queuemove'],
      usage: 'move <from_pos> <to_pos> OR move <#voice_channel>',
      slashData: new SlashCommandBuilder()
        .setName('move')
        .setDescription('Move track position or move bot voice channel')
        .addIntegerOption(o => o.setName('from').setDescription('Current position in queue').setRequired(true))
        .addIntegerOption(o => o.setName('to').setDescription('New position in queue').setRequired(true))
    });
  }

  async execute(ctx, args) {
    const queue = ctx.client.music.getQueue(ctx.guild.id);
    if (!queue) return ctx.sendError('Not Playing', 'No music queue is currently active.');

    // Check if moving to a voice channel
    if (ctx.raw.mentions && ctx.raw.mentions.channels && ctx.raw.mentions.channels.first()) {
      const channel = ctx.raw.mentions.channels.first();
      if (channel.type === 2) { // GUILD_VOICE
        ctx.client.music.joinVoice(ctx.guild, channel.id);
        queue.voiceChannel = channel;
        return ctx.sendSuccess('Moved Channel', `🔊 Moved playback to <#${channel.id}>!`);
      }
    }

    const from = ctx.isSlash ? ctx.raw.options.getInteger('from') : parseInt(args[0]);
    const to = ctx.isSlash ? ctx.raw.options.getInteger('to') : parseInt(args[1]);

    if (isNaN(from) || isNaN(to) || from < 1 || to < 1 || from > queue.songs.length || to > queue.songs.length) {
      return ctx.sendError('Invalid Positions', `Enter valid queue numbers between 1 and ${queue.songs.length}.`);
    }

    const target = queue.songs.splice(from - 1, 1)[0];
    queue.songs.splice(to - 1, 0, target);

    return ctx.sendSuccess('Queue Moved', `🔀 Moved [**${target.title}**](${target.url}) from position **#${from}** to **#${to}**!`);
  }
}

module.exports = MoveCommand;
