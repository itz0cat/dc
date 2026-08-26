const { PermissionsBitField } = require('discord.js');
const RotiEmbed = require('../utils/embed.js');
const botConfig = require('../config.js');

class Command {
  constructor(options = {}) {
    this.name = options.name;
    this.description = options.description || 'No description provided';
    this.category = options.category || 'Utility';
    this.aliases = options.aliases || [];
    this.usage = options.usage || options.name;
    this.userPermissions = options.userPermissions || [];
    this.botPermissions = options.botPermissions || [
      PermissionsBitField.Flags.SendMessages,
      PermissionsBitField.Flags.EmbedLinks
    ];
    this.ownerOnly = options.ownerOnly || false;
    this.guildOnly = options.guildOnly !== undefined ? options.guildOnly : true;
    this.slashData = options.slashData || null; // SlashCommandBuilder instance or JSON
  }

  // Unified context creation for Slash & Prefix
  createContext(interactionOrMessage, args = []) {
    const isSlash = Boolean(interactionOrMessage.isChatInputCommand);
    const client = interactionOrMessage.client;
    const guild = interactionOrMessage.guild;
    const channel = interactionOrMessage.channel;
    const member = interactionOrMessage.member;
    const user = isSlash ? interactionOrMessage.user : interactionOrMessage.author;

    return {
      isSlash,
      raw: interactionOrMessage,
      client,
      guild,
      channel,
      member,
      user,
      args,
      
      // Unified reply method
      reply: async (options) => {
        let payload = typeof options === 'string' ? { content: options } : options;
        if (payload instanceof RotiEmbed || payload.data) {
          payload = { embeds: [payload] };
        }

        if (isSlash) {
          if (interactionOrMessage.deferred || interactionOrMessage.replied) {
            return interactionOrMessage.editReply(payload);
          }
          return interactionOrMessage.reply(payload);
        } else {
          return channel.send(payload);
        }
      },

      // Unified ephemeral reply
      replyEphemeral: async (options) => {
        let payload = typeof options === 'string' ? { content: options } : options;
        if (payload instanceof RotiEmbed || payload.data) {
          payload = { embeds: [payload] };
        }

        if (isSlash) {
          if (interactionOrMessage.deferred || interactionOrMessage.replied) {
            return interactionOrMessage.editReply(payload);
          }
          return interactionOrMessage.reply({ ...payload, ephemeral: true });
        } else {
          return channel.send(payload);
        }
      },

      // Unified defer reply
      defer: async (ephemeral = false) => {
        if (isSlash) {
          if (!interactionOrMessage.deferred && !interactionOrMessage.replied) {
            return interactionOrMessage.deferReply({ ephemeral });
          }
        } else {
          await channel.sendTyping().catch(() => {});
        }
      },

      // Embed response helpers
      sendSuccess: (title, description) => {
        return (isSlash && (interactionOrMessage.deferred || interactionOrMessage.replied))
          ? interactionOrMessage.editReply({ embeds: [RotiEmbed.success(title, description)] })
          : (isSlash ? interactionOrMessage.reply({ embeds: [RotiEmbed.success(title, description)] }) : channel.send({ embeds: [RotiEmbed.success(title, description)] }));
      },

      sendError: (title, description) => {
        return (isSlash && (interactionOrMessage.deferred || interactionOrMessage.replied))
          ? interactionOrMessage.editReply({ embeds: [RotiEmbed.error(title, description)] })
          : (isSlash ? interactionOrMessage.reply({ embeds: [RotiEmbed.error(title, description)] }) : channel.send({ embeds: [RotiEmbed.error(title, description)] }));
      },

      sendWarning: (title, description) => {
        return (isSlash && (interactionOrMessage.deferred || interactionOrMessage.replied))
          ? interactionOrMessage.editReply({ embeds: [RotiEmbed.warning(title, description)] })
          : (isSlash ? interactionOrMessage.reply({ embeds: [RotiEmbed.warning(title, description)] }) : channel.send({ embeds: [RotiEmbed.warning(title, description)] }));
      }
    };
  }

  // To be implemented by commands
  async execute(ctx) {
    throw new Error(`Command ${this.name} has no execute implementation`);
  }
}

module.exports = Command;
