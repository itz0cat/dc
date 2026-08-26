const {
  SlashCommandBuilder,
  ActionRowBuilder,
  StringSelectMenuBuilder,
  ButtonBuilder,
  ButtonStyle,
  ComponentType
} = require('discord.js');
const Command = require('../Command.js');
const RotiEmbed = require('../../utils/embed.js');
const botConfig = require('../../config.js');

class HelpCommand extends Command {
  constructor() {
    super({
      name: 'help',
      description: 'Display the complete Hade-style interactive music & server command center',
      category: 'Utility',
      aliases: ['commands', 'h', 'menu'],
      usage: 'help [category / command]',
      slashData: new SlashCommandBuilder()
        .setName('help')
        .setDescription('Interactive command directory')
        .addStringOption(opt => opt.setName('query').setDescription('Command name or category'))
    });
  }

  getCategoryEmbed(categoryKey, client, prefix) {
    const categoryData = {
      music: {
        title: 'Music',
        cmds: [
          'connect', 'playfile', 'play', 'autoplay', 'grab', 'clear', 'skip', 'loop', 'skipto', 'queue',
          'queue reverse', 'history', 'shuffle', 'stop', 'volume', 'replay', 'previous', 'previous add',
          'pause', 'resume', 'remove', 'remove dupes', 'remove user', 'leavecleanup', 'bump', 'seek',
          'nowplaying', 'disconnect', 'forward', 'rewind', 'lyrics', 'lyrics search', 'search', 'radio',
          'speak', 'move', 'move bot', 'voteskip'
        ]
      },
      favourites: {
        title: 'Favourites',
        cmds: [
          'like', 'dislike', 'showliked', 'clearliked', 'playliked', 'sortliked', 'playlist',
          'playlist create', 'playlist addtrack', 'playlist removetrack', 'playlist list',
          'playlist setcover', 'playlist view', 'playlist addnowplaying', 'playlist play',
          'playlist import', 'playlist delete', 'playlist savequeue'
        ]
      },
      config: {
        title: 'Config',
        cmds: [
          'debug', 'voicechannelstatus', 'announce', 'buttons', '247', 'settings', 'settings reset',
          'setprefix', 'switchaudionode', 'forcefix', 'dj', 'dj restrict', 'dj info', 'dj reset',
          'restrictcommand'
        ]
      },
      miscellaneous: {
        title: 'Miscellaneous',
        cmds: [
          'ping', 'statistics', 'statistics lavalink', 'invite', 'support', 'vote', 'premium',
          'premium check', 'premium purchase', 'premium deactivate', 'premium activate',
          'premium noprefix', 'customize', 'afk', 'calculator', 'weather', 'wikipedia', 'crypto'
        ]
      },
      lastfm: {
        title: 'Lastfm',
        cmds: [
          'lastfm', 'lastfm login', 'lastfm scrobble', 'lastfm logout'
        ]
      },
      spotify: {
        title: 'Spotify',
        cmds: [
          'spotify', 'spotify login', 'spotify logout', 'spotify playlists', 'searchplaylist',
          'searchartist', 'searchalbum'
        ]
      },
      filters: {
        title: 'Filters',
        cmds: [
          'resetfilter', '8d', 'karaoke', 'lofi', 'nightcore', 'daycore', 'bassboost', 'deepbass',
          'darthvader', 'chipmunk', 'slowed', 'vibration', 'vibrato', 'tremolo'
        ]
      },
      moderation: {
        title: 'Moderation & Server',
        cmds: [
          'ban', 'kick', 'softban', 'tempban', 'timeout', 'removetimeout', 'warn', 'warnings',
          'delwarn', 'clearwarns', 'lock', 'unlock', 'purge', 'ticket', 'ticket archive',
          'ticket reopen', 'ticket transcript', 'welcome', 'autorole', 'verification', 'antinuke'
        ]
      },
      tracking: {
        title: 'Falcon Tracking',
        cmds: [
          'invites', 'inviter', 'topinvites', 'inviteroles', 'vanity', 'messages', 'topmessages',
          'messageroles', 'voicetime', 'topvoice', 'voiceroles', 'voicemaster'
        ]
      }
    };

    const cat = categoryData[categoryKey.toLowerCase()] || categoryData.music;
    const now = new Date();
    const timeStr = now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });

    const embed = new RotiEmbed()
      .setTitle(`__${cat.title}__`)
      .setDescription(`\`\`\`\n${cat.cmds.join(', ')}\n\`\`\``)
      .setFooter({ text: `Total Commands: ${cat.cmds.length} | Today at ${timeStr}`, iconURL: client.user.displayAvatarURL() })
      .setColor(botConfig.colors.teal);

    return embed;
  }

  getOverviewEmbed(client, prefix) {
    return new RotiEmbed()
      .setTitle(`✨ Cat Help Menu ✨`)
      .setDescription(
        `### 🚀 Jumpstart Your Music Journey\n` +
        `🎵 \`/play <song name | URL>\` - Start enjoying your favorite tunes instantly.\n\n` +
        `### 📜 Command Categories\n` +
        `• 🎶 **Music**\n` +
        `• 🤍 **Favourites**\n` +
        `• ⚙️ **Config**\n` +
        `• 🗞️ **Miscellaneous**\n` +
        `• ❤️ **Lastfm**\n` +
        `• 💚 **Spotify**\n` +
        `• 🎛️ **Filters**\n` +
        `• 🛡️ **Moderation & Server**\n` +
        `• 📊 **Falcon Tracking**`
      )
      .setFooter({ text: `Tune In, Turn Up – Only with Cat Music!`, iconURL: client.user.displayAvatarURL() })
      .setColor(botConfig.colors.teal);
  }

  getComponents(client) {
    const selectMenu = new ActionRowBuilder().addComponents(
      new StringSelectMenuBuilder()
        .setCustomId('help_select')
        .setPlaceholder('Select A Category From Menu')
        .addOptions([
          { label: 'Home / Overview', value: 'home', emoji: '✨' },
          { label: 'Music', value: 'music', emoji: '🎶' },
          { label: 'Favourites', value: 'favourites', emoji: '🤍' },
          { label: 'Config', value: 'config', emoji: '⚙️' },
          { label: 'Miscellaneous', value: 'miscellaneous', emoji: '🗞️' },
          { label: 'Lastfm', value: 'lastfm', emoji: '❤️' },
          { label: 'Spotify', value: 'spotify', emoji: '💚' },
          { label: 'Filters', value: 'filters', emoji: '🎛️' },
          { label: 'Moderation & Server', value: 'moderation', emoji: '🛡️' },
          { label: 'Falcon Tracking', value: 'tracking', emoji: '📊' }
        ])
    );

    const buttonRow = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setLabel('Invite')
        .setStyle(ButtonStyle.Link)
        .setURL(`https://discord.com/oauth2/authorize?client_id=${client.user.id}&permissions=8&scope=bot%20applications.commands`)
        .setEmoji('✉️'),
      new ButtonBuilder()
        .setLabel('Support Server')
        .setStyle(ButtonStyle.Link)
        .setURL('https://docs.letsroti.com/')
        .setEmoji('📢'),
      new ButtonBuilder()
        .setLabel('Premium')
        .setStyle(ButtonStyle.Link)
        .setURL('https://github.com/itz0cat/dc')
        .setEmoji('🧡')
    );

    return [selectMenu, buttonRow];
  }

  async execute(ctx, args) {
    const query = ctx.isSlash ? ctx.raw.options?.getString('query') : args.join(' ').toLowerCase();
    const prefix = ctx.client.db.getPrefix(ctx.guild.id);

    if (query) {
      const command = ctx.client.commands.get(query) || ctx.client.aliases.get(query);
      if (command) {
        const embed = new RotiEmbed()
          .setTitle(`📖 Command: ${command.name}`)
          .setDescription(command.description)
          .addFields(
            { name: 'Category', value: `\`${command.category}\``, inline: true },
            { name: 'Aliases', value: command.aliases.length > 0 ? command.aliases.map(a => `\`${a}\``).join(', ') : '*None*', inline: true },
            { name: 'Syntax / Usage', value: `\`${prefix}${command.usage}\` or \`/${command.name}\``, inline: false }
          )
          .setColor(botConfig.colors.teal);
        return ctx.reply({ embeds: [embed] });
      }

      const categories = ['music', 'favourites', 'config', 'miscellaneous', 'lastfm', 'spotify', 'filters', 'moderation', 'tracking'];
      const matchedCat = categories.find(c => c.startsWith(query));
      if (matchedCat) {
        const embed = this.getCategoryEmbed(matchedCat, ctx.client, prefix);
        return ctx.reply({ embeds: [embed], components: this.getComponents(ctx.client) });
      }
    }

    const overviewEmbed = this.getOverviewEmbed(ctx.client, prefix);
    const components = this.getComponents(ctx.client);

    let msg;
    if (ctx.isSlash) {
      msg = await ctx.raw.reply({ embeds: [overviewEmbed], components, fetchReply: true });
    } else {
      msg = await ctx.channel.send({ embeds: [overviewEmbed], components });
    }

    const authorId = ctx.user.id;
    const collector = msg.createMessageComponentCollector({
      componentType: ComponentType.StringSelect,
      time: 120000
    });

    collector.on('collect', async (sel) => {
      if (sel.user.id !== authorId) {
        return sel.reply({ content: '❌ Open your own help menu with `?help`!', ephemeral: true });
      }

      const val = sel.values[0];
      if (val === 'home') {
        return sel.update({ embeds: [this.getOverviewEmbed(ctx.client, prefix)], components });
      } else {
        return sel.update({ embeds: [this.getCategoryEmbed(val, ctx.client, prefix)], components });
      }
    });

    collector.on('end', () => {
      const disabledSelect = new ActionRowBuilder().addComponents(
        StringSelectMenuBuilder.from(components[0].components[0]).setDisabled(true)
      );
      msg.edit({ components: [disabledSelect, components[1]] }).catch(() => {});
    });
  }
}

module.exports = HelpCommand;
