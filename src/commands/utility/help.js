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
      description: 'Display the complete interactive Cat command center directory and category menus',
      category: 'Utility',
      aliases: ['commands', 'h', 'menu'],
      usage: 'help [command / category]',
      slashData: new SlashCommandBuilder()
        .setName('help')
        .setDescription('Interactive command directory')
        .addStringOption(opt => opt.setName('query').setDescription('Command name or category'))
    });
  }

  getCategoryEmbed(categoryName, client, prefix) {
    const cmds = client.commands.filter(c => c.category.toLowerCase() === categoryName.toLowerCase());
    const icons = {
      music: '🎵',
      server: '🛠️',
      moderation: '🛡️',
      roles: '🎭',
      automod: '🤖',
      giveaway: '🎉',
      highlight: '🔔',
      minigames: '🎮',
      fun: '🎲',
      utility: '⚙️'
    };

    const icon = icons[categoryName.toLowerCase()] || '📁';
    const embed = new RotiEmbed()
      .setTitle(`${icon} ${categoryName.toUpperCase()} MODULE (${cmds.size} Commands)`)
      .setDescription(`Use \`${prefix}<command>\` or \`/<command>\` to execute any command.\nFor detailed parameters, type \`${prefix}help <command>\`.\n`)
      .setColor(botConfig.colors.teal);

    const formattedList = cmds.map(c => `**\`${prefix}${c.name}\`** • ${c.description}`).join('\n\n');
    embed.setDescription(`${embed.data.description}\n${formattedList}`);
    return embed;
  }

  getOverviewEmbed(client, prefix) {
    const totalCommands = client.commands.size;
    const totalCategories = new Set(client.commands.map(c => c.category)).size;

    return new RotiEmbed()
      .setTitle(`🐱 Cat Command Center`)
      .setDescription(
        `Welcome to **Cat**! The ultimate high-performance all-in-one Discord bot.\n\n` +
        `**Command Prefix:** \`${prefix}\` *(e.g. \`${prefix}help\`, \`${prefix}play\`)*\n` +
        `**Slash Commands:** Fully supported with \`/\`\n` +
        `**Theme Color:** Teal Blue (\`#00A896\`)\n` +
        `**Developer:** \`${botConfig.creator}\`\n\n` +
        `━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
        `### 📁 **Available Modules (${totalCategories})**\n` +
        `> 🎵 **Music** — YouTube/Spotify streaming, queue, volume, loop, lyrics, np\n` +
        `> 🛠️ **Server Management** — Welcome cards, tickets, suggestions, starboard, logs, tags\n` +
        `> 🛡️ **Moderation** — Bans, mutes, warnings, cases, locks, purges, modlogs\n` +
        `> 🎭 **Role Administration** — Button roles, select menus, reaction roles, temprole\n` +
        `> 🤖 **AutoMod** — Anti-invites, anti-links, anti-spam, caps filter, banned words\n` +
        `> 🎉 **Giveaways** — Timed interactive giveaways, quick reaction drops, rerolls\n` +
        `> 🔔 **Highlights** — Custom keyword DM mention notifications\n` +
        `> 🎮 **Mini-Games** — Blackjack, Tic-Tac-Toe, Connect 4, Snake, Trivia, RPS\n` +
        `> 🎲 **Fun & Social** — Memes, cats, dogs, jokes, ascii, polls, quotes, anime actions\n` +
        `> ⚙️ **Utilities** — Weather, translator, QR generator, URL shortener, userinfo, calc\n` +
        `━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
        `📊 **Total Available Commands:** \`${totalCommands}+\`\n\n` +
        `*Select a category from the dropdown menu below to view full command details.*`
      )
      .setThumbnail(client.user.displayAvatarURL())
      .setColor(botConfig.colors.primary);
  }

  getSelectMenu() {
    return new ActionRowBuilder().addComponents(
      new StringSelectMenuBuilder()
        .setCustomId('help_select')
        .setPlaceholder('📂 Select a category to explore commands...')
        .addOptions([
          { label: 'Home / Overview', value: 'home', description: 'Return to main command center overview', emoji: '🏠' },
          { label: 'Music', value: 'Music', description: 'Music playback, queue, lyrics, volume, loop', emoji: '🎵' },
          { label: 'Server Management', value: 'Server', description: 'Tickets, suggestions, welcome, starboard, logs', emoji: '🛠️' },
          { label: 'Moderation & Cases', value: 'Moderation', description: 'Bans, mutes, kicks, warnings, cases, locks, purge', emoji: '🛡️' },
          { label: 'Role Administration', value: 'Roles', description: 'Button roles, select menus, temproles, autoroles', emoji: '🎭' },
          { label: 'AutoMod Protection', value: 'Automod', description: 'Anti-invite, anti-link, anti-spam, blacklist words', emoji: '🤖' },
          { label: 'Giveaways & Drops', value: 'Giveaway', description: 'Interactive giveaways, timer drops, rerolls', emoji: '🎉' },
          { label: 'Highlights & Alerts', value: 'Highlight', description: 'Keyword DM alerts and mention tracking', emoji: '🔔' },
          { label: 'Mini-Games', value: 'Minigames', description: 'Blackjack, Tic-Tac-Toe, Connect 4, Snake, Trivia', emoji: '🎮' },
          { label: 'Fun & Social', value: 'Fun', description: 'Memes, cats, dogs, jokes, ascii, rate, anime actions', emoji: '🎲' },
          { label: 'Utilities & Tools', value: 'Utility', description: 'Weather, translate, QR, shortener, userinfo, calc', emoji: '⚙️' }
        ])
    );
  }

  async execute(ctx, args) {
    const query = ctx.isSlash ? ctx.raw.options.getString('query') : args.join(' ').toLowerCase();
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
            { name: 'Aliases', value: command.aliases.length > 0 ? command.aliases.map(a => `\`${a}\``).join(', ') : '*None*', inline: true },
            { name: 'Syntax / Usage', value: `\`${prefix}${command.usage}\` or \`/${command.name}\``, inline: false }
          )
          .setColor(botConfig.colors.teal);
        return ctx.reply({ embeds: [embed] });
      }

      // If query matches a category name
      const categories = ['music', 'server', 'moderation', 'roles', 'automod', 'giveaway', 'highlight', 'minigames', 'fun', 'utility'];
      const matchedCat = categories.find(c => c.startsWith(query));
      if (matchedCat) {
        const capName = matchedCat.charAt(0).toUpperCase() + matchedCat.slice(1);
        const embed = this.getCategoryEmbed(capName, ctx.client, prefix);
        return ctx.reply({ embeds: [embed], components: [this.getSelectMenu()] });
      }
    }

    // Default Overview Page
    const overviewEmbed = this.getOverviewEmbed(ctx.client, prefix);
    const menu = this.getSelectMenu();

    let msg;
    if (ctx.isSlash) {
      msg = await ctx.raw.reply({ embeds: [overviewEmbed], components: [menu], fetchReply: true });
    } else {
      msg = await ctx.channel.send({ embeds: [overviewEmbed], components: [menu] });
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
        return sel.update({ embeds: [this.getOverviewEmbed(ctx.client, prefix)], components: [menu] });
      } else {
        return sel.update({ embeds: [this.getCategoryEmbed(val, ctx.client, prefix)], components: [menu] });
      }
    });

    collector.on('end', () => {
      const disabledMenu = new ActionRowBuilder().addComponents(
        StringSelectMenuBuilder.from(menu.components[0]).setDisabled(true)
      );
      msg.edit({ components: [disabledMenu] }).catch(() => {});
    });
  }
}

module.exports = HelpCommand;
