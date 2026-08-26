const { SlashCommandBuilder, PermissionFlagsBits, ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType } = require('discord.js');
const Command = require('../Command.js');
const RotiEmbed = require('../../utils/embed.js');
const botConfig = require('../../config.js');

class VkickCommand extends Command {
  constructor() {
    super({
      name: 'vkick',
      description: 'Start a community vote to kick a user from the server',
      category: 'Moderation',
      aliases: ['votekick'],
      usage: 'vkick <user> [required_votes]',
      slashData: new SlashCommandBuilder()
        .setName('vkick')
        .setDescription('Start a community vote to kick a user')
        .addUserOption(opt => opt.setName('user').setDescription('Target user').setRequired(true))
        .addIntegerOption(opt => opt.setName('votes').setDescription('Required votes (default: 5)').setMinValue(2).setMaxValue(50))
    });
  }

  async execute(ctx, args) {
    const targetUser = ctx.isSlash ? ctx.raw.options.getUser('user') : ctx.raw.mentions.users.first();
    if (!targetUser) return ctx.sendError('Missing User', 'Please specify a member to vote kick.');

    const targetMember = ctx.guild.members.cache.get(targetUser.id);
    if (!targetMember) return ctx.sendError('Not in Server', 'Target member is not in the server.');

    if (!targetMember.kickable) {
      return ctx.sendError('Cannot Kick', 'This member cannot be kicked.');
    }

    const requiredVotes = ctx.isSlash ? (ctx.raw.options.getInteger('votes') || 5) : (parseInt(args[1]) || 5);
    const votesYes = new Set();
    const votesNo = new Set();

    const embed = new RotiEmbed()
      .setTitle('🗳️ Vote Kick Initiated')
      .setDescription(`A vote kick has been started against <@${targetUser.id}> (${targetUser.tag})!\n**Required Yes Votes:** ${requiredVotes}\n**Time Limit:** 60 seconds`)
      .addFields(
        { name: '✅ Yes Votes', value: '0', inline: true },
        { name: '❌ No Votes', value: '0', inline: true }
      )
      .setColor(botConfig.colors.warning);

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId('vk_yes').setLabel('Vote Yes (Kick)').setStyle(ButtonStyle.Danger),
      new ButtonBuilder().setCustomId('vk_no').setLabel('Vote No (Keep)').setStyle(ButtonStyle.Secondary)
    );

    let msg;
    if (ctx.isSlash) {
      msg = await ctx.raw.reply({ embeds: [embed], components: [row], fetchReply: true });
    } else {
      msg = await ctx.channel.send({ embeds: [embed], components: [row] });
    }

    const collector = msg.createMessageComponentCollector({
      componentType: ComponentType.Button,
      time: 60000
    });

    collector.on('collect', async (btn) => {
      if (btn.user.id === targetUser.id) {
        return btn.reply({ content: '❌ You cannot vote on your own vote kick!', ephemeral: true });
      }

      if (btn.customId === 'vk_yes') {
        votesNo.delete(btn.user.id);
        votesYes.add(btn.user.id);
      } else {
        votesYes.delete(btn.user.id);
        votesNo.add(btn.user.id);
      }

      const updatedEmbed = RotiEmbed.from(embed).setFields(
        { name: '✅ Yes Votes', value: `${votesYes.size} / ${requiredVotes}`, inline: true },
        { name: '❌ No Votes', value: `${votesNo.size}`, inline: true }
      );

      await btn.update({ embeds: [updatedEmbed] }).catch(() => {});

      if (votesYes.size >= requiredVotes) {
        collector.stop('kicked');
      }
    });

    collector.on('end', async (collected, endReason) => {
      if (endReason === 'kicked') {
        await targetMember.kick(`Vote kicked by community (${votesYes.size} votes)`).catch(() => {});
        const kickedEmbed = new RotiEmbed()
          .setTitle('👢 Member Kicked by Vote')
          .setDescription(`<@${targetUser.id}> has been kicked from the server by community vote (${votesYes.size} votes)!`)
          .setColor(botConfig.colors.error);
        msg.edit({ embeds: [kickedEmbed], components: [] }).catch(() => {});
      } else {
        const failedEmbed = new RotiEmbed()
          .setTitle('🗳️ Vote Kick Failed')
          .setDescription(`Vote kick against <@${targetUser.id}> failed. Did not reach required ${requiredVotes} votes in time.`)
          .setColor(botConfig.colors.teal);
        msg.edit({ embeds: [failedEmbed], components: [] }).catch(() => {});
      }
    });
  }
}

module.exports = VkickCommand;
