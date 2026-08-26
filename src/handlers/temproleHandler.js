function startTemproleLoop(client) {
  setInterval(async () => {
    try {
      const expiredRoles = client.db.prepare('SELECT * FROM temproles WHERE expires_at <= ?').all(Date.now());
      for (const item of expiredRoles) {
        try {
          const guild = client.guilds.cache.get(item.guild_id);
          if (guild) {
            const member = await guild.members.fetch(item.user_id).catch(() => null);
            if (member && member.roles.cache.has(item.role_id)) {
              await member.roles.remove(item.role_id, 'Temporary role expired').catch(() => {});
            }
          }
        } catch (e) {}
        client.db.prepare('DELETE FROM temproles WHERE id = ?').run(item.id);
      }
    } catch (err) {
      client.logger.error('Error in temprole loop:', err);
    }
  }, 15000);
}

module.exports = {
  startTemproleLoop
};
