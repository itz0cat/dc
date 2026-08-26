const { SlashCommandBuilder } = require('discord.js');
const Command = require('../Command.js');
const RotiEmbed = require('../../utils/embed.js');
const botConfig = require('../../config.js');

class RadioCommand extends Command {
  constructor() {
    super({
      name: 'radio',
      description: 'Stream 24/7 online radio stations (Lofi, Synthwave, Gaming, Chill, Pop)',
      category: 'Music',
      usage: 'radio [station]',
      slashData: new SlashCommandBuilder()
        .setName('radio')
        .setDescription('Play 24/7 radio stations')
        .addStringOption(opt => opt.setName('station').setDescription('Radio station genre').addChoices(
          { name: '☕ Lofi Chill Beats', value: 'lofi' },
          { name: '🌆 Synthwave / Cyberpunk', value: 'synthwave' },
          { name: '🎮 Gaming Beats & EDM', value: 'gaming' },
          { name: '🎹 Classical & Piano', value: 'piano' }
        ))
    });
  }

  async execute(ctx, args) {
    const station = ctx.isSlash ? (ctx.raw.options.getString('station') || 'lofi') : (args[0]?.toLowerCase() || 'lofi');
    const voiceChannel = ctx.member.voice.channel;

    if (!voiceChannel) {
      return ctx.sendError('Voice Channel Required', 'You must be in a voice channel to listen to radio.');
    }

    const stations = {
      lofi: { title: '☕ 24/7 Lofi Hip Hop Chill Beats', url: 'https://youtube.com/watch?v=jfKfPfyJRdk', thumb: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=500' },
      synthwave: { title: '🌆 24/7 Synthwave & Cyberpunk Radio', url: 'https://youtube.com/watch?v=4xDzrJKXOOY', thumb: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=500' },
      gaming: { title: '🎮 24/7 Gaming Beats & EDM Live', url: 'https://youtube.com/watch?v=7NOSDKb0HlU', thumb: 'https://images.unsplash.com/photo-1538481199705-c710c4e965fc?w=500' },
      piano: { title: '🎹 24/7 Relaxing Classical & Piano', url: 'https://youtube.com/watch?v=WDXPJWIgX-o', thumb: 'https://images.unsplash.com/photo-1520523839898-507128ef5b8a?w=500' }
    };

    const selected = stations[station] || stations.lofi;

    let queue = ctx.client.music.getQueue(ctx.guild.id);
    if (!queue) {
      queue = ctx.client.music.createQueue(ctx.guild.id, ctx.channel, voiceChannel);
    }

    const song = {
      title: selected.title,
      url: selected.url,
      durationStr: 'LIVE 24/7',
      durationMs: 86400000,
      thumbnail: selected.thumb,
      requesterId: ctx.user.id
    };

    await ctx.client.music.play(queue, song);
    return ctx.sendSuccess('Radio Started', `📻 **Streaming Live Radio:** [${selected.title}](${selected.url}) in <#${voiceChannel.id}>!`);
  }
}

module.exports = RadioCommand;
