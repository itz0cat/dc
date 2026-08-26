const { SlashCommandBuilder, PermissionFlagsBits, parseEmoji } = require('discord.js');
const Command = require('../Command.js');
const RotiEmbed = require('../../utils/embed.js');
const botConfig = require('../../config.js');

class EmojiCommand extends Command {
  constructor() {
    super({
      name: 'emoji',
      description: 'Add custom emojis to your server from URL or existing emojis',
      category: 'Moderation',
      aliases: ['emojis', 'addemoji'],
      usage: 'emoji <add/list> [emoji/url] [name]',
      userPermissions: [PermissionFlagsBits.ManageGuildExpressions || PermissionFlagsBits.ManageEmojisAndStickers],
      botPermissions: [PermissionFlagsBits.ManageGuildExpressions || PermissionFlagsBits.ManageEmojisAndStickers],
      slashData: new SlashCommandBuilder()
        .setName('emoji')
        .setDescription('Manage server custom emojis')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuildExpressions || PermissionFlagsBits.ManageEmojisAndStickers)
        .addSubcommand(sub => sub.setName('add').setDescription('Add custom emoji').addStringOption(opt => opt.setName('emoji').setDescription('Emoji or Image URL').setRequired(true)).addStringOption(opt => opt.setName('name').setDescription('Emoji name').setRequired(true)))
        .addSubcommand(sub => sub.setName('list').setDescription('List all server custom emojis'))
    });
  }

  async execute(ctx, args) {
    const sub = ctx.isSlash ? ctx.raw.options.getSubcommand() : (args[0]?.toLowerCase() === 'list' ? 'list' : 'add');
    const guild = ctx.guild;

    if (sub === 'add') {
      const emojiInput = ctx.isSlash ? ctx.raw.options.getString('emoji') : args[0];
      const emojiName = ctx.isSlash ? ctx.raw.options.getString('name') : args[1];

      if (!emojiInput || !emojiName) return ctx.sendError('Missing Parameters', 'Usage: `emoji add <emoji/url> <name>`');

      let url = emojiInput;
      const parsed = parseEmoji(emojiInput);
      if (parsed && parsed.id) {
        url = `https://cdn.discordapp.com/emojis/${parsed.id}.${parsed.animated ? 'gif' : 'png'}`;
      }

      try {
        const created = await guild.emojis.create({ attachment: url, name: emojiName });
        return ctx.sendSuccess('Emoji Added', `Successfully added emoji ${created} (\`:${created.name}:\`) to the server!`);
      } catch (err) {
        return ctx.sendError('Failed to Add Emoji', `Could not add emoji: ${err.message}`);
      }
    }

    if (sub === 'list') {
      const emojis = guild.emojis.cache;
      if (emojis.size === 0) return ctx.reply({ embeds: [RotiEmbed.info('Server Emojis', 'This server has no custom emojis.')] });

      const animated = emojis.filter(e => e.animated).map(e => `${e}`).join(' ');
      const standard = emojis.filter(e => !e.animated).map(e => `${e}`).join(' ');

      const embed = new RotiEmbed()
        .setTitle(`😀 Server Custom Emojis (${emojis.size})`)
        .addFields(
          { name: `Standard (${emojis.filter(e => !e.animated).size})`, value: standard ? standard.slice(0, 1024) : '*None*' },
          { name: `Animated (${emojis.filter(e => e.animated).size})`, value: animated ? animated.slice(0, 1024) : '*None*' }
        )
        .setColor(botConfig.colors.teal);
      return ctx.reply({ embeds: [embed] });
    }
  }
}

module.exports = EmojiCommand;
