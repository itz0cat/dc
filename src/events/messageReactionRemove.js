module.exports = async (client, reaction, user) => {
  if (user.bot) return;

  if (reaction.partial) {
    try {
      await reaction.fetch();
    } catch (e) {
      return;
    }
  }

  const message = reaction.message;
  if (!message.guild) return;

  const guildId = message.guild.id;

  // Reaction Roles Removal
  const rr = client.db.prepare('SELECT role_id FROM button_roles WHERE guild_id = ? AND message_id = ? AND emoji = ?')
    .pluck().get(guildId, message.id, reaction.emoji.name);
  
  if (rr) {
    const member = await message.guild.members.fetch(user.id).catch(() => null);
    if (member && member.roles.cache.has(rr)) {
      await member.roles.remove(rr, 'Reaction role removed').catch(() => {});
    }
  }
};
