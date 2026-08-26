const { SlashCommandBuilder } = require('discord.js');
const Command = require('../Command.js');
const RotiEmbed = require('../../utils/embed.js');
const botConfig = require('../../config.js');

class LookupCommand extends Command {
  constructor() {
    super({
      name: 'lookup',
      description: 'Fetch and inspect global Discord user information by user ID',
      category: 'Utility',
      usage: 'lookup <user_id>',
      slashData: new SlashCommandBuilder()
        .setName('lookup')
        .setDescription('Get global user info by ID')
        .addStringOption(opt => opt.setName('user_id').setDescription('User ID').setRequired(true))
    });
  }

  async execute(ctx, args) {
    const userId = ctx.isSlash ? ctx.raw.options.getString('user_id') : args[0];
    if (!userId) return ctx.sendError('Missing ID', 'Please provide a Discord User ID.');

    try {
      const user = await ctx.client.users.fetch(userId, { force: true });
      const embed = new RotiEmbed()
        .setTitle(`🔍 Global User Lookup: ${user.tag}`)
        .setThumbnail(user.displayAvatarURL({ size: 1024, forceStatic: false }))
        .addFields(
          { name: 'Username', value: user.username, inline: true },
          { name: 'User ID', value: `\`${user.id}\``, inline: true },
          { name: 'Bot Account', value: user.bot ? 'Yes' : 'No', inline: true },
          { name: 'Created At', value: `<t:${Math.floor(user.createdTimestamp / 1000)}:F> (<t:${Math.floor(user.createdTimestamp / 1000)}:R>)`, inline: false }
        )
        .setColor(botConfig.colors.teal);

      if (user.banner) {
        embed.setImage(user.bannerURL({ size: 1024 }));
      }

      return ctx.reply({ embeds: [embed] });
    } catch (err) {
      return ctx.sendError('User Not Found', `Could not find a user with ID \`${userId}\`.`);
    }
  }
}

module.exports = LookupCommand;
