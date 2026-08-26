const {
  ChannelType,
  PermissionsBitField,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle
} = require('discord.js');
const RotiEmbed = require('../utils/embed.js');
const botConfig = require('../config.js');
const { createTranscript } = require('../utils/transcript.js');

module.exports = async (client, interaction) => {
  // 1. Slash Command Handling
  if (interaction.isChatInputCommand()) {
    const command = client.commands.get(interaction.commandName);
    if (!command) return;

    if (command.guildOnly && !interaction.guild) {
      return interaction.reply({
        embeds: [RotiEmbed.error('Server Only', 'This command can only be used inside a Discord server.')],
        ephemeral: true
      });
    }

    if (command.ownerOnly && interaction.user.id !== client.config.ownerId) {
      return interaction.reply({
        embeds: [RotiEmbed.error('Access Denied', 'This command is restricted to the bot owner.')],
        ephemeral: true
      });
    }

    if (command.userPermissions && command.userPermissions.length > 0) {
      const missing = interaction.member.permissions.missing(command.userPermissions);
      if (missing.length > 0 && !interaction.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
        return interaction.reply({
          embeds: [RotiEmbed.error('Missing Permissions', `You need: \`${missing.join(', ')}\``)],
          ephemeral: true
        });
      }
    }

    // Convert interaction options to args array for context
    const args = [];
    interaction.options.data.forEach(opt => {
      if (opt.value !== undefined) args.push(String(opt.value));
    });

    const ctx = command.createContext(interaction, args);
    try {
      await command.execute(ctx, args);
    } catch (err) {
      client.logger.error(`Error executing slash command /${interaction.commandName}:`, err);
      if (interaction.deferred || interaction.replied) {
        interaction.editReply({ embeds: [RotiEmbed.error('Execution Error', `An error occurred: \`${err.message}\``)] }).catch(() => {});
      } else {
        interaction.reply({ embeds: [RotiEmbed.error('Execution Error', `An error occurred: \`${err.message}\``)], ephemeral: true }).catch(() => {});
      }
    }
    return;
  }

  // 2. Button Interactions
  if (interaction.isButton()) {
    const customId = interaction.customId;
    const guild = interaction.guild;
    const user = interaction.user;

    // === TICKET CREATION ===
    if (customId.startsWith('ticket_create:')) {
      const categoryName = customId.split(':')[1] || 'Support';
      const panel = client.db.prepare('SELECT * FROM ticket_panels WHERE guild_id = ?').get(guild.id);
      
      // Check existing open ticket for user
      const existing = client.db.prepare("SELECT * FROM tickets WHERE guild_id = ? AND user_id = ? AND status != 'closed'").get(guild.id, user.id);
      if (existing) {
        return interaction.reply({
          content: `⚠️ You already have an open ticket in <#${existing.channel_id}>!`,
          ephemeral: true
        });
      }

      await interaction.deferReply({ ephemeral: true });

      try {
        const ticketNum = (client.db.prepare('SELECT COUNT(*) FROM tickets WHERE guild_id = ?').pluck().get(guild.id) || 0) + 1;
        const channelName = `ticket-${user.username}-${ticketNum}`.toLowerCase().replace(/[^a-z0-9-_]/g, '');

        const permissionOverwrites = [
          {
            id: guild.id,
            deny: [PermissionsBitField.Flags.ViewChannel]
          },
          {
            id: user.id,
            allow: [
              PermissionsBitField.Flags.ViewChannel,
              PermissionsBitField.Flags.SendMessages,
              PermissionsBitField.Flags.AttachFiles,
              PermissionsBitField.Flags.EmbedLinks,
              PermissionsBitField.Flags.ReadMessageHistory
            ]
          },
          {
            id: client.user.id,
            allow: [
              PermissionsBitField.Flags.ViewChannel,
              PermissionsBitField.Flags.SendMessages,
              PermissionsBitField.Flags.ManageChannels,
              PermissionsBitField.Flags.EmbedLinks
            ]
          }
        ];

        if (panel && panel.role_id) {
          permissionOverwrites.push({
            id: panel.role_id,
            allow: [
              PermissionsBitField.Flags.ViewChannel,
              PermissionsBitField.Flags.SendMessages,
              PermissionsBitField.Flags.AttachFiles,
              PermissionsBitField.Flags.EmbedLinks
            ]
          });
        }

        const ticketChannel = await guild.channels.create({
          name: channelName,
          type: ChannelType.GuildText,
          parent: panel?.parent_category_id || null,
          permissionOverwrites
        });

        // Insert into DB
        client.db.prepare(`
          INSERT INTO tickets (guild_id, channel_id, user_id, category, status, created_at)
          VALUES (?, ?, ?, ?, 'open', ?)
        `).run(guild.id, ticketChannel.id, user.id, categoryName, Date.now());

        const ticketEmbed = new RotiEmbed()
          .setTitle(`🎫 Ticket: ${categoryName} (#${ticketNum})`)
          .setDescription(panel?.initial_message || `Welcome <@${user.id}>! Support staff will assist you shortly.`)
          .addFields(
            { name: 'Created by', value: `<@${user.id}> (${user.tag})`, inline: true },
            { name: 'Category', value: categoryName, inline: true }
          )
          .setColor(botConfig.colors.teal);

        const row = new ActionRowBuilder().addComponents(
          new ButtonBuilder().setCustomId('ticket_claim').setLabel('Claim Ticket').setEmoji('🙋‍♂️').setStyle(ButtonStyle.Primary),
          new ButtonBuilder().setCustomId('ticket_close').setLabel('Close Ticket').setEmoji('🔒').setStyle(ButtonStyle.Danger),
          new ButtonBuilder().setCustomId('ticket_transcript').setLabel('Transcript').setEmoji('📄').setStyle(ButtonStyle.Secondary)
        );

        await ticketChannel.send({
          content: `${user} ${panel?.role_id ? `<@&${panel.role_id}>` : ''}`,
          embeds: [ticketEmbed],
          components: [row]
        });

        return interaction.editReply({
          content: `✅ Your ticket has been created: <#${ticketChannel.id}>!`
        });
      } catch (err) {
        client.logger.error('Error creating ticket channel:', err);
        return interaction.editReply({
          content: `❌ Failed to create ticket: ${err.message}`
        });
      }
    }

    // === TICKET CLAIM ===
    if (customId === 'ticket_claim') {
      const ticket = client.db.prepare('SELECT * FROM tickets WHERE channel_id = ?').get(interaction.channel.id);
      if (!ticket) return interaction.reply({ content: '❌ Not a valid ticket channel.', ephemeral: true });

      if (ticket.claimed_by) {
        return interaction.reply({ content: `⚠️ This ticket is already claimed by <@${ticket.claimed_by}>!`, ephemeral: true });
      }

      client.db.prepare("UPDATE tickets SET status = 'claimed', claimed_by = ? WHERE id = ?").run(user.id, ticket.id);
      await interaction.channel.setName(`✅-${interaction.channel.name}`).catch(() => {});

      const panel = client.db.prepare('SELECT * FROM ticket_panels WHERE guild_id = ?').get(guild.id);
      if (panel && panel.claimed_category_id) {
        await interaction.channel.setParent(panel.claimed_category_id).catch(() => {});
      }

      return interaction.reply({
        embeds: [RotiEmbed.success('Ticket Claimed', `This ticket has been claimed by <@${user.id}>!`)]
      });
    }

    // === TICKET CLOSE ===
    if (customId === 'ticket_close') {
      const ticket = client.db.prepare('SELECT * FROM tickets WHERE channel_id = ?').get(interaction.channel.id);
      if (!ticket) return interaction.reply({ content: '❌ Not a valid ticket channel.', ephemeral: true });

      await interaction.reply({ embeds: [RotiEmbed.warning('Closing Ticket', 'Generating transcript and closing channel in 5 seconds...')] });

      client.db.prepare("UPDATE tickets SET status = 'closed', closed_at = ?, close_reason = 'Closed by user' WHERE id = ?")
        .run(Date.now(), ticket.id);

      const transcript = await createTranscript(interaction.channel);

      // Send to ticket creator DM
      const creator = await client.users.fetch(ticket.user_id).catch(() => null);
      if (creator && transcript) {
        creator.send({
          embeds: [RotiEmbed.info('Ticket Closed', `Your ticket in **${guild.name}** has been closed. Attached is the complete conversation transcript.`)],
          files: [transcript]
        }).catch(() => {});
      }

      // Send to log channel
      const panel = client.db.prepare('SELECT log_channel_id FROM ticket_panels WHERE guild_id = ?').get(guild.id);
      if (panel && panel.log_channel_id) {
        const logChan = guild.channels.cache.get(panel.log_channel_id);
        if (logChan && transcript) {
          logChan.send({
            embeds: [RotiEmbed.info('Ticket Transcript Log', `**Ticket:** #${interaction.channel.name}\n**User:** <@${ticket.user_id}>\n**Closed by:** <@${user.id}>`)],
            files: [transcript]
          }).catch(() => {});
        }
      }

      setTimeout(() => {
        interaction.channel.delete('Ticket closed').catch(() => {});
      }, 5000);
      return;
    }

    // === TICKET TRANSCRIPT ===
    if (customId === 'ticket_transcript') {
      await interaction.deferReply({ ephemeral: true });
      const transcript = await createTranscript(interaction.channel);
      if (!transcript) {
        return interaction.editReply({ content: '❌ Failed to generate transcript.' });
      }
      return interaction.editReply({
        content: '📄 Here is the transcript for this ticket:',
        files: [transcript]
      });
    }

    // === GIVEAWAY ENTER ===
    if (customId.startsWith('ga_enter:')) {
      const gaId = customId.split(':')[1];
      const ga = client.db.prepare('SELECT * FROM giveaways WHERE id = ?').get(gaId);
      if (!ga || ga.status !== 'active') {
        return interaction.reply({ content: '❌ This giveaway is no longer active!', ephemeral: true });
      }

      // Check role requirement
      if (ga.required_role_id && !interaction.member.roles.cache.has(ga.required_role_id)) {
        return interaction.reply({
          content: `❌ You must have the <@&${ga.required_role_id}> role to enter this giveaway!`,
          ephemeral: true
        });
      }

      let entries = JSON.parse(ga.entries || '[]');
      if (entries.includes(user.id)) {
        // Leave giveaway
        entries = entries.filter(id => id !== user.id);
        client.db.prepare('UPDATE giveaways SET entries = ? WHERE id = ?').run(JSON.stringify(entries), gaId);
        return interaction.reply({ content: '❌ You left the giveaway.', ephemeral: true });
      } else {
        // Enter giveaway
        entries.push(user.id);
        client.db.prepare('UPDATE giveaways SET entries = ? WHERE id = ?').run(JSON.stringify(entries), gaId);
        return interaction.reply({ content: `🎉 You entered the giveaway for **${ga.prize}**! (${entries.length} entries)`, ephemeral: true });
      }
    }

    // === SUGGESTIONS UPVOTE / DOWNVOTE ===
    if (customId.startsWith('sug_up:') || customId.startsWith('sug_down:')) {
      const isUp = customId.startsWith('sug_up:');
      const sugId = customId.split(':')[1];
      const sug = client.db.prepare('SELECT * FROM suggestions WHERE id = ?').get(sugId);
      if (!sug) return interaction.reply({ content: '❌ Suggestion not found.', ephemeral: true });

      if (isUp) {
        client.db.prepare('UPDATE suggestions SET upvotes = upvotes + 1 WHERE id = ?').run(sugId);
      } else {
        client.db.prepare('UPDATE suggestions SET downvotes = downvotes + 1 WHERE id = ?').run(sugId);
      }

      const updated = client.db.prepare('SELECT * FROM suggestions WHERE id = ?').get(sugId);
      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId(`sug_up:${sugId}`).setLabel(`${updated.upvotes} 👍`).setStyle(ButtonStyle.Success),
        new ButtonBuilder().setCustomId(`sug_down:${sugId}`).setLabel(`${updated.downvotes} 👎`).setStyle(ButtonStyle.Danger),
        new ButtonBuilder().setCustomId(`sug_thread:${sugId}`).setLabel('Discussion Thread').setEmoji('💬').setStyle(ButtonStyle.Secondary)
      );

      await interaction.message.edit({ components: [row] }).catch(() => {});
      return interaction.reply({ content: `✅ Recorded your vote for Suggestion #${sugId}!`, ephemeral: true });
    }

    // === SUGGESTION THREAD ===
    if (customId.startsWith('sug_thread:')) {
      const sugId = customId.split(':')[1];
      if (interaction.message.thread) {
        return interaction.reply({ content: `💬 Thread already exists: <#${interaction.message.thread.id}>`, ephemeral: true });
      }
      const thread = await interaction.message.startThread({
        name: `Suggestion #${sugId} Discussion`,
        autoArchiveDuration: 1440
      }).catch(err => null);

      if (thread) {
        return interaction.reply({ content: `✅ Created discussion thread: <#${thread.id}>!`, ephemeral: true });
      } else {
        return interaction.reply({ content: '❌ Unable to create thread in this channel.', ephemeral: true });
      }
    }

    // === BUTTON ROLES TOGGLE ===
    if (customId.startsWith('role_toggle:')) {
      const roleId = customId.split(':')[1];
      const role = guild.roles.cache.get(roleId);
      if (!role) return interaction.reply({ content: '❌ Role not found.', ephemeral: true });

      if (interaction.member.roles.cache.has(roleId)) {
        await interaction.member.roles.remove(roleId).catch(() => {});
        return interaction.reply({ content: `❌ Removed role **${role.name}** from you.`, ephemeral: true });
      } else {
        await interaction.member.roles.add(roleId).catch(() => {});
        return interaction.reply({ content: `✅ Granted role **${role.name}** to you!`, ephemeral: true });
      }
    }
  }

  // 3. Select Menu Interactions (Select Roles)
  if (interaction.isStringSelectMenu()) {
    if (interaction.customId === 'selectrole_menu') {
      const selectedRoleIds = interaction.values;
      let added = [];
      let removed = [];

      for (const roleId of selectedRoleIds) {
        const role = interaction.guild.roles.cache.get(roleId);
        if (!role) continue;
        if (interaction.member.roles.cache.has(roleId)) {
          await interaction.member.roles.remove(roleId).catch(() => {});
          removed.push(role.name);
        } else {
          await interaction.member.roles.add(roleId).catch(() => {});
          added.push(role.name);
        }
      }

      let text = 'Roles updated:';
      if (added.length > 0) text += `\n✅ Added: **${added.join(', ')}**`;
      if (removed.length > 0) text += `\n❌ Removed: **${removed.join(', ')}**`;

      return interaction.reply({ content: text, ephemeral: true });
    }
  }
};
