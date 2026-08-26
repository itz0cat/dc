const { SlashCommandBuilder, ActionRowBuilder, StringSelectMenuBuilder, ComponentType } = require('discord.js');
const Command = require('../Command.js');
const RotiEmbed = require('../../utils/embed.js');
const botConfig = require('../../config.js');
const yts = require('yt-search');

class SearchCommand extends Command {
  constructor() {
    super({
      name: 'search',
      description: 'Search for songs, artists, or playlists with an interactive track selection menu',
      category: 'Music',
      aliases: ['searchartist', 'searchalbum', 'searchplaylist', 'findsong'],
      usage: 'search <song / artist / album name>',
      slashData: new SlashCommandBuilder()
        .setName('search')
        .setDescription('Search for songs with selection menu')
        .addStringOption(o => o.setName('query').setDescription('Search terms').setRequired(true))
    });
  }

  async execute(ctx, args) {
    const query = ctx.isSlash ? ctx.raw.options.getString('query') : args.join(' ');
    if (!query) return ctx.sendError('Missing Query', 'Provide a song, artist, or album title to search.');

    const voiceChannel = ctx.member.voice.channel;
    if (!voiceChannel) return ctx.sendError('Voice Channel Required', 'Connect to a voice channel first.');

    await ctx.defer();

    try {
      const searchRes = await yts(query);
      const videos = (searchRes.videos || []).slice(0, 10);

      if (videos.length === 0) {
        return ctx.sendError('No Results', `No tracks found for \`${query}\`.`);
      }

      const options = videos.map((v, i) => ({
        label: `${i + 1}. ${v.title.slice(0, 80)}`,
        description: `${v.author?.name || 'Artist'} • ${v.timestamp || '3:30'} • ${v.views ? v.views.toLocaleString() + ' views' : ''}`.slice(0, 100),
        value: String(i)
      }));

      const selectMenu = new ActionRowBuilder().addComponents(
        new StringSelectMenuBuilder()
          .setCustomId('search_select')
          .setPlaceholder('Select a song to play...')
          .addOptions(options)
      );

      const listStr = videos.map((v, i) => `**${i + 1}.** [${v.title}](${v.url})\n> 👤 \`${v.author?.name || 'Artist'}\` • ⏱️ \`${v.timestamp}\` • 👁️ \`${v.views ? v.views.toLocaleString() : 'N/A'}\``).join('\n\n');

      const embed = new RotiEmbed()
        .setTitle(`🔍 Search Results: "${query}"`)
        .setDescription(listStr)
        .setFooter({ text: 'Select a track from the dropdown below within 45s' })
        .setColor(botConfig.colors.teal);

      let msg;
      if (ctx.isSlash) {
        msg = await ctx.raw.editReply({ embeds: [embed], components: [selectMenu] });
      } else {
        msg = await ctx.channel.send({ embeds: [embed], components: [selectMenu] });
      }

      const collector = msg.createMessageComponentCollector({
        componentType: ComponentType.StringSelect,
        time: 45000,
        max: 1
      });

      collector.on('collect', async (sel) => {
        if (sel.user.id !== ctx.user.id) {
          return sel.reply({ content: '❌ Use your own `?search` command to select tracks.', ephemeral: true });
        }

        const selectedIndex = parseInt(sel.values[0]);
        const chosen = videos[selectedIndex];

        const song = {
          title: chosen.title,
          url: chosen.url,
          artist: chosen.author?.name || 'Artist',
          artistUrl: chosen.author?.url || chosen.url,
          durationStr: chosen.timestamp || '3:30',
          durationMs: (chosen.seconds || 210) * 1000,
          views: chosen.views ? chosen.views.toLocaleString() : 'N/A',
          thumbnail: chosen.thumbnail || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=500',
          source: 'Spotify',
          sourceIconUrl: 'https://cdn-icons-png.flaticon.com/512/174/174872.png',
          sourceColor: 0x1DB954,
          requesterId: ctx.user.id
        };

        let queue = ctx.client.music.getQueue(ctx.guild.id);
        if (!queue) {
          queue = ctx.client.music.createQueue(ctx.guild.id, ctx.channel, voiceChannel);
        } else {
          ctx.client.music.joinVoice(ctx.guild, voiceChannel.id);
        }

        if (queue.playing) {
          queue.songs.push(song);
          const addEmbed = new RotiEmbed()
            .setAuthor({ name: 'Spotify Enqueued Track', iconURL: 'https://cdn-icons-png.flaticon.com/512/174/174872.png' })
            .setDescription(`✅ **Added** [**${song.title}**](${song.url}) **to the queue.**\n\n**Duration :** \`${song.durationStr}\` • **Requestor :** <@${ctx.user.id}> • **Position :** \`${queue.songs.length}\``)
            .setThumbnail(song.thumbnail)
            .setColor(0x1DB954);
          return sel.update({ embeds: [addEmbed], components: [] });
        } else {
          await ctx.client.music.play(queue, song);
          return sel.update({ content: `🎶 Started playing **${song.title}**!`, embeds: [], components: [] });
        }
      });

      collector.on('end', (collected) => {
        if (collected.size === 0) {
          msg.edit({ components: [] }).catch(() => {});
        }
      });
    } catch (e) {
      return ctx.sendError('Search Error', `Failed to perform search: ${e.message}`);
    }
  }
}

module.exports = SearchCommand;
