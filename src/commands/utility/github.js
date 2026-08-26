const { SlashCommandBuilder } = require('discord.js');
const Command = require('../Command.js');
const RotiEmbed = require('../../utils/embed.js');
const botConfig = require('../../config.js');

class GithubCommand extends Command {
  constructor() {
    super({
      name: 'github',
      description: 'Search for and inspect GitHub repositories and statistics',
      category: 'Utility',
      aliases: ['gh', 'repo'],
      usage: 'github <repository> (e.g. discordjs/discord.js)',
      slashData: new SlashCommandBuilder()
        .setName('github')
        .setDescription('Search for a GitHub repository')
        .addStringOption(opt => opt.setName('repository').setDescription('Repository (e.g. owner/repo)').setRequired(true))
    });
  }

  async execute(ctx, args) {
    const repoName = ctx.isSlash ? ctx.raw.options.getString('repository') : args.join(' ');
    if (!repoName) return ctx.sendError('Missing Repository', 'Please provide a repository (e.g. `expressjs/express`).');

    await ctx.defer();
    try {
      const res = await fetch(`https://api.github.com/repos/${encodeURIComponent(repoName.trim())}`);
      if (!res.ok) {
        return ctx.sendError('Not Found', `Repository \`${repoName}\` was not found on GitHub.`);
      }
      const data = await res.json();

      const embed = new RotiEmbed()
        .setTitle(`🐙 ${data.full_name}`)
        .setURL(data.html_url)
        .setDescription(data.description || '*No description provided.*')
        .setThumbnail(data.owner?.avatar_url)
        .addFields(
          { name: 'Stars', value: `⭐ ${data.stargazers_count.toLocaleString()}`, inline: true },
          { name: 'Forks', value: `🍴 ${data.forks_count.toLocaleString()}`, inline: true },
          { name: 'Language', value: `💻 ${data.language || 'Unknown'}`, inline: true },
          { name: 'Open Issues', value: `❗ ${data.open_issues_count.toLocaleString()}`, inline: true },
          { name: 'License', value: `📜 ${data.license?.spdx_id || 'None'}`, inline: true },
          { name: 'Created At', value: `<t:${Math.floor(new Date(data.created_at).getTime() / 1000)}:d>`, inline: true }
        )
        .setColor(botConfig.colors.teal);

      return ctx.reply({ embeds: [embed] });
    } catch (err) {
      return ctx.sendError('Fetch Error', 'Failed to communicate with GitHub API.');
    }
  }
}

module.exports = GithubCommand;
