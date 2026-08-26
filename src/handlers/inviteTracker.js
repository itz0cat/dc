const { Collection } = require('discord.js');

class InviteTracker {
  constructor(client) {
    this.client = client;
    this.guildInvites = new Collection(); // GuildId -> Collection(Code -> uses)
  }

  async init() {
    for (const [guildId, guild] of this.client.guilds.cache) {
      await this.cacheGuildInvites(guild);
    }
  }

  async cacheGuildInvites(guild) {
    try {
      if (!guild.members.me?.permissions.has('ManageGuild')) return;
      const invites = await guild.invites.fetch().catch(() => null);
      if (!invites) return;

      const cache = new Collection();
      for (const [code, invite] of invites) {
        cache.set(code, invite.uses);
        
        // Save to DB
        this.client.db.prepare(`
          INSERT INTO invite_codes (guild_id, code, user_id, uses)
          VALUES (?, ?, ?, ?)
          ON CONFLICT(code) DO UPDATE SET uses = ?
        `).run(guild.id, code, invite.inviter?.id || 'vanity', invite.uses, invite.uses);
      }
      this.guildInvites.set(guild.id, cache);
    } catch (e) {
      // Missing permissions or guild rate-limited
    }
  }

  async findUsedInvite(guild) {
    const cached = this.guildInvites.get(guild.id) || new Collection();
    const current = await guild.invites.fetch().catch(() => null);
    if (!current) return null;

    let usedInvite = null;
    for (const [code, invite] of current) {
      const cachedUses = cached.get(code) || 0;
      if (invite.uses > cachedUses) {
        usedInvite = invite;
        break;
      }
    }

    // Refresh cache
    const newCache = new Collection();
    for (const [code, invite] of current) {
      newCache.set(code, invite.uses);
      this.client.db.prepare(`
        INSERT INTO invite_codes (guild_id, code, user_id, uses)
        VALUES (?, ?, ?, ?)
        ON CONFLICT(code) DO UPDATE SET uses = ?
      `).run(guild.id, code, invite.inviter?.id || 'vanity', invite.uses, invite.uses);
    }
    this.guildInvites.set(guild.id, newCache);

    return usedInvite;
  }

  async checkInviteRoles(guild, userId, totalInvites) {
    const rewards = this.client.db.prepare('SELECT * FROM invite_roles WHERE guild_id = ? AND invites_needed <= ? ORDER BY invites_needed ASC').all(guild.id, totalInvites);
    const member = await guild.members.fetch(userId).catch(() => null);
    if (!member) return;

    for (const rew of rewards) {
      if (guild.roles.cache.has(rew.role_id) && !member.roles.cache.has(rew.role_id)) {
        await member.roles.add(rew.role_id, `Invite reward for reaching ${rew.invites_needed} invites`).catch(() => {});
      }
    }
  }
}

module.exports = InviteTracker;
