const { SlashCommandBuilder } = require('discord.js');
const Command = require('../Command.js');
const RotiEmbed = require('../../utils/embed.js');
const botConfig = require('../../config.js');

class JoinCommand extends Command {
  constructor() {
    super({
      name: 'join',
      description: 'Connect the bot to your current voice channel',
      category: 'Music',
      aliases: ['connect'],
      usage: 'join',
      slashData: new SlashCommandBuilder()
        .setName('join')
        .setDescription('Join your voice channel')
    });
  }

  async execute(ctx) {
    const voiceChannel = ctx.member.voice.channel;
    if (!voiceChannel) return ctx.sendError('Voice Channel Required', 'You must be in a voice channel for me to join.');

    let queue = ctx.client.music.getQueue(ctx.guild.id);
    if (!queue) {
      queue = ctx.client.music.createQueue(ctx.guild.id, ctx.channel, voiceChannel);
    }

    return ctx.sendSuccess('Voice Connected', `🔊 Connected to <#${voiceChannel.id}>!`);
  }
}

module.exports = JoinCommand;
