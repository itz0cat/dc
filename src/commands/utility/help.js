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
      description: 'Display the complete interactive command directory and category menu',
      category: 'Utility',
      aliases: ['commands', 'h', 'menu'],
      usage: 'help [command / category]',
      slashData: new SlashCommandBuilder()
        .setName('help')
        .setDescription('Interactive command directory')
        .addStringOption(opt => opt.setName('query').setDescription('Command name or category'))
    });
  }

  getCategoryEmbed(categoryKey, client, prefix) {
    const categoriesMap = {
      tracking: { name: 'Falcon Tracking & Growth', icon: '📊', desc: 'Invite tracking, message counts, voice activity & automated milestone role rewards' },
      voice: { name: 'VoiceMaster (Temp Voice)', icon: '🔊', desc: 'Join-to-Create custom temporary voice channels with lock, limit, permit and claim' },
      security: { name: 'Anti-Nuke & Security', icon: '🛡️', desc: 'Server raid defense, anti-bot add, mass ban/kick blocks and admin whitelisting' },
      music: { name: 'Music & Audio', icon: '🎵', desc: 'High-quality music streaming, queue, audio filters, favourites & lyrics' },
      server: { name: 'Server Management', icon: '🛠️', desc: 'Welcome cards, ticket system, suggestions, starboard, logging & verification' },
      moderation: { name: 'Moderation', icon: '🔨', desc: 'Bans, softbans, timeouts, warnings, cases, locks, purges & modlogs' },
      roles: { name: 'Role Administration', icon: '🎭', desc: 'Button self-roles, dropdown select roles, vanity status roles & temproles' },
      automod: { name: 'AutoMod', icon: '🤖', desc: 'Anti-invite links, anti-external links, anti-spam, caps filter & blacklist words' },
      giveaway: { name: 'Giveaways', icon: '🎉', desc: 'Interactive timed giveaways, quick reaction drops, rerolls & winner picking' },
      highlight: { name: 'Highlights', icon: '🔔', desc: 'Custom keyword direct message mention notifications' },
      minigames: { name: 'Mini-Games', icon: '🎮', desc: 'Blackjack, Tic-Tac-Toe, Connect 4, Snake, Trivia & Rock-Paper-Scissors' },
      fun: { name: 'Fun & Social', icon: '🎲', desc: 'Memes, cute cat/dog images, jokes, ascii art, ratings, polls & anime actions' },
      utility: { name: 'Utility', icon: '⚙️', desc: 'Weather, translator, QR generator, URL shortener, userinfo, calc & stats' }
    };

    const catKey = categoryKey.toLowerCase();
    const catInfo = categoriesMap[catKey] || { name: categoryKey, icon: '📁', desc: 'Module commands' };
    
    // Filter matching commands from loaded collection
    const cmds = client.commands.filter(c => {
      const cCat = (c.category || '').toLowerCase();
      if (catKey === 'tracking') return cCat === 'tracking';
      if (catKey === 'voice') return cCat === 'voice';
      if (catKey === 'security') return cCat === 'security';
      if (catKey === 'giveaway') return cCat === 'giveaway';
      if (catKey === 'highlight') return cCat === 'highlight';
      if (catKey === 'minigames') return cCat === 'minigames';
      return cCat === catKey;
    });

    const embed = new RotiEmbed()
      .setTitle(`${catInfo.icon} ${catInfo.name} Commands`)
      .setDescription(
        `*${catInfo.desc}*\n\n` +
        `Prefix: \`${prefix}\` or use Slash Commands (\`/\`)\n` +
        `For detailed info on a command: \`${prefix}help <command>\`\n` +
        `━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n` +
        (cmds.size > 0 
          ? cmds.map(c => `**\`${prefix}${c.name}\`**\n> ${c.description}${c.aliases && c.aliases.length > 0 ? `\n> *Aliases: ${c.aliases.map(a => `\`${a}\``).join(', ')}*` : ''}`).join('\n\n')
          : '*No commands in this category.*')
      )
      .setFooter({ text: `Total Commands in Category: ${cmds.size}`, iconURL: client.user.displayAvatarURL() })
      .setColor(botConfig.colors.teal);

    return embed;
  }

  getOverviewEmbed(client, prefix) {
    return new RotiEmbed()
      .setTitle(`🛡️ ${botConfig.name} Command Directory`)
      .setDescription(
        `Welcome to **${botConfig.name}**! The premier all-in-one Discord bot.\n` +
        `Prefix: \`${prefix}\` or use Slash Commands (\`/\`).\n` +
        `Select a category from the dropdown menu below to view its commands.\n\n` +
        `📊 **Falcon Tracking**\n` +
        `\`${prefix}invites\`, \`${prefix}inviter\`, \`${prefix}topinvites\`, \`${prefix}messages\`, \`${prefix}voicetime\`\n\n` +
        `🔊 **VoiceMaster & Security**\n` +
        `\`${prefix}voicemaster setup\`, \`${prefix}antinuke\`, \`${prefix}verification\`, \`${prefix}vanityrole\`\n\n` +
        `🎵 **Music & Audio**\n` +
        `\`${prefix}play\`, \`${prefix}skip\`, \`${prefix}filter\`, \`${prefix}like\`, \`${prefix}queue\`, \`${prefix}nowplaying\`\n\n` +
        `🛠️ **Server Management**\n` +
        `\`${prefix}welcome\`, \`${prefix}ticket\`, \`${prefix}suggestion\`, \`${prefix}starboard\`, \`${prefix}tag\`, \`${prefix}greet\`\n\n` +
        `🔨 **Moderation**\n` +
        `\`${prefix}ban\`, \`${prefix}kick\`, \`${prefix}timeout\`, \`${prefix}warn\`, \`${prefix}purge\`, \`${prefix}lock\`, \`${prefix}slowmode\`\n\n` +
        `🎭 **Role Administration**\n` +
        `\`${prefix}buttonrole\`, \`${prefix}selectrole\`, \`${prefix}reactionrole\`, \`${prefix}temprole\`, \`${prefix}role\`, \`${prefix}autorole\`\n\n` +
        `🤖 **AutoMod**\n` +
        `\`${prefix}automod\`, \`${prefix}banword\`\n\n` +
        `🎉 **Giveaways & Highlights**\n` +
        `\`${prefix}giveaway start\`, \`${prefix}giveaway drop\`, \`${prefix}highlight add\`\n\n` +
        `🎮 **Mini-Games & Fun**\n` +
        `\`${prefix}blackjack\`, \`${prefix}tictactoe\`, \`${prefix}connectfour\`, \`${prefix}snake\`, \`${prefix}trivia\`, \`${prefix}8ball\`, \`${prefix}meme\`\n\n` +
        `⚙️ **Utilities**\n` +
        `\`${prefix}weather\`, \`${prefix}translate\`, \`${prefix}qr\`, \`${prefix}userinfo\`, \`${prefix}serverinfo\`, \`${prefix}calc\`, \`${prefix}ping\``
      )
      .setThumbnail(client.user.displayAvatarURL())
      .setFooter({ text: `Cat • Made with ❤️ by itz0cat`, iconURL: client.user.displayAvatarURL() })
      .setColor(botConfig.colors.teal);
  }

  getComponents(client) {
    const selectMenu = new ActionRowBuilder().addComponents(
      new StringSelectMenuBuilder()
        .setCustomId('help_select')
        .setPlaceholder('Select a category...')
        .addOptions([
          { label: 'Overview', value: 'home', description: 'Return to main command directory', emoji: '🏠' },
          { label: 'Falcon Tracking', value: 'tracking', description: 'Invite tracking, message counts, voice time & roles', emoji: '📊' },
          { label: 'VoiceMaster', value: 'voice', description: 'Join-to-Create temporary voice channels', emoji: '🔊' },
          { label: 'Anti-Nuke & Security', value: 'security', description: 'Anti-bot, anti-raid, and security protection', emoji: '🛡️' },
          { label: 'Music & Audio', value: 'music', description: 'Music playback, filters, favourites, queue, lyrics', emoji: '🎵' },
          { label: 'Server Management', value: 'server', description: 'Tickets, suggestions, welcome, starboard, logs', emoji: '🛠️' },
          { label: 'Moderation', value: 'moderation', description: 'Bans, mutes, kicks, warnings, cases, lock, purge', emoji: '🔨' },
          { label: 'Role Administration', value: 'roles', description: 'Button roles, select menus, reaction roles, vanity role', emoji: '🎭' },
          { label: 'AutoMod', value: 'automod', description: 'Anti-invite, anti-link, anti-spam, bad words filter', emoji: '🤖' },
          { label: 'Giveaways', value: 'giveaway', description: 'Timed giveaways, reaction drops, rerolls', emoji: '🎉' },
          { label: 'Highlights', value: 'highlight', description: 'Keyword DM alerts and mention tracking', emoji: '🔔' },
          { label: 'Mini-Games', value: 'minigames', description: 'Blackjack, Tic-Tac-Toe, Connect 4, Snake, Trivia', emoji: '🎮' },
          { label: 'Fun & Social', value: 'fun', description: 'Memes, cat/dog photos, jokes, ascii, anime actions', emoji: '🎲' },
          { label: 'Utilities', value: 'utility', description: 'Weather, translate, QR, shortener, userinfo, calc', emoji: '⚙️' }
        ])
    );

    const buttonRow = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setLabel('Invite Cat')
        .setStyle(ButtonStyle.Link)
        .setURL(`https://discord.com/oauth2/authorize?client_id=${client.user.id}&permissions=8&scope=bot%20applications.commands`)
        .setEmoji('✨'),
      new ButtonBuilder()
        .setLabel('Documentation')
        .setStyle(ButtonStyle.Link)
        .setURL('https://docs.letsroti.com/')
        .setEmoji('📖'),
      new ButtonBuilder()
        .setLabel('GitHub')
        .setStyle(ButtonStyle.Link)
        .setURL('https://github.com/itz0cat/dc')
        .setEmoji('🐙')
    );

    return [selectMenu, buttonRow];
  }

  async execute(ctx, args) {
    const query = ctx.isSlash ? ctx.raw.options?.getString('query') : args.join(' ').toLowerCase();
    const prefix = ctx.client.db.getPrefix(ctx.guild.id);

    // If query matches a specific command
    if (query) {
      const command = ctx.client.commands.get(query) || ctx.client.aliases.get(query);
      if (command) {
        const embed = new RotiEmbed()
          .setTitle(`📖 Command: ${command.name}`)
          .setDescription(command.description)
          .addFields(
            { name: 'Category', value: `\`${command.category}\``, inline: true },
            { name: 'Aliases', value: command.aliases && command.aliases.length > 0 ? command.aliases.map(a => `\`${a}\``).join(', ') : '*None*', inline: true },
            { name: 'Syntax / Usage', value: `\`${prefix}${command.usage}\` or \`/${command.name}\``, inline: false }
          )
          .setColor(botConfig.colors.teal);
        return ctx.reply({ embeds: [embed] });
      }

      // If query matches a category name
      const categories = ['tracking', 'voice', 'security', 'music', 'server', 'moderation', 'roles', 'automod', 'giveaway', 'highlight', 'minigames', 'fun', 'utility'];
      const matchedCat = categories.find(c => c.startsWith(query));
      if (matchedCat) {
        const embed = this.getCategoryEmbed(matchedCat, ctx.client, prefix);
        return ctx.reply({ embeds: [embed], components: this.getComponents(ctx.client) });
      }
    }

    // Default Overview Page
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
        return sel.reply({ content: '❌ Use `?help` to open your own interactive menu!', ephemeral: true });
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
