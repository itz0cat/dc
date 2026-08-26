const { SlashCommandBuilder } = require('discord.js');
const Command = require('../Command.js');

class VoteskipCommand extends Command {
  constructor() {
    super({
      name: 'voteskip',
      description: 'Vote to skip the current song with other members in the voice channel',
      category: 'Music',
      aliases: ['vs'],
      usage: 'voteskip',
      slashData: new SlashCommandBuilder()
        .setName('voteskip')
        .setDescription('Vote to skip current track')
    });
  }

  async execute(ctx) {
    const queue = ctx.client.music.getQueue(ctx.guild.id);
    if (!queue || !queue.current) return ctx.sendError('Not Playing', 'No music is currently playing.');

    const voiceChannel = ctx.member.voice.channel;
    if (!voiceChannel) return ctx.sendError('Voice Required', 'You must be in the voice channel to vote.');

    const membersInVC = voiceChannel.members.filter(m => !m.user.bot).size;
    const requiredVotes = Math.ceil(membersInVC / 2);

    if (!queue.voteskips) queue.voteskips = new Set();

    if (queue.voteskips.has(ctx.user.id)) {
      return ctx.sendWarning('Already Voted', `You have already voted! (${queue.voteskips.size}/${requiredVotes} votes)`);
    }

    queue.voteskips.add(ctx.user.id);

    if (queue.voteskips.size >= requiredVotes) {
      queue.voteskips.clear();
      ctx.client.music.handleSongEnd(ctx.guild.id);
      return ctx.sendSuccess('Song Skipped', `⏭️ Vote threshold reached (**${requiredVotes}/${requiredVotes}**)! Skipping to next track.`);
    } else {
      return ctx.sendSuccess('Vote Registered', `🗳️ **${ctx.user.username}** voted to skip (**${queue.voteskips.size}/${requiredVotes}** required votes).`);
    }
  }
}

module.exports = VoteskipCommand;
