const { MessageEmbed } = require('../utils/shims.js');
const { oneLine } = require('common-tags');
const { PermissionsBitField } = require('discord.js');

module.exports = async (client, message) => {
  if (!message.guild || !message.channel || message.author.bot) return;

  // Ensure guild exists in db
  client.db.settings.insertRow.run(
    message.guild.id,
    message.guild.name,
    message.guild.systemChannelId || null,
    message.guild.systemChannelId || null,
    message.guild.systemChannelId || null,
    message.guild.systemChannelId || null,
    null, null, null, null, null
  );

  // Ensure user exists in db
  client.db.users.insertRow.run(
    message.author.id,
    message.author.username,
    message.author.discriminator || '0',
    message.guild.id,
    message.guild.name,
    message.member?.joinedAt ? message.member.joinedAt.toString() : new Date().toString(),
    0
  );

  // Get disabled commands
  let disabledCommands = client.db.settings.selectDisabledCommands.pluck().get(message.guild.id) || [];
  if (typeof disabledCommands === 'string') disabledCommands = disabledCommands.split(' ');
  
  // Get points
  const pointsData = client.db.settings.selectPoints.get(message.guild.id) || {
    point_tracking: 1,
    message_points: 1,
    command_points: 1
  };
  const { point_tracking: pointTracking, message_points: messagePoints, command_points: commandPoints } = pointsData;

  // Command handler
  const prefix = client.db.settings.selectPrefix.pluck().get(message.guild.id) || 'c!';
  const prefixRegex = new RegExp(`^(<@!?${client.user.id}>|${prefix.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})\\s*`);

  if (prefixRegex.test(message.content)) {

    // Get mod channels
    let modChannelIds = message.client.db.settings.selectModChannelIds.pluck().get(message.guild.id) || [];
    if (typeof modChannelIds === 'string') modChannelIds = modChannelIds.split(' ');

    const match = message.content.match(prefixRegex);
    const args = message.content.slice(match[0].length).trim().split(/ +/g);
    const cmd = args.shift().toLowerCase();
    let command = client.commands.get(cmd) || client.aliases.get(cmd);

    if (command && !disabledCommands.includes(command.name)) {

      // Check if mod channel
      if (modChannelIds.includes(message.channel.id)) {
        if (command.type !== client.types.MOD) {
          if (pointTracking) {
            client.db.users.updatePoints.run(messagePoints, messagePoints, message.author.id, message.guild.id);
          }
          return;
        }
      }

      // Check permissions
      const permission = command.checkPermissions(message);
      if (permission) {
        if (pointTracking) {
          client.db.users.updatePoints.run(commandPoints, commandPoints, message.author.id, message.guild.id);
        }
        message.command = true;
        return command.run(message, args);
      }
    } else if ( 
      (message.content === `<@${client.user.id}>` || message.content === `<@!${client.user.id}>`) &&
      !modChannelIds.includes(message.channel.id)
    ) {
      const me = message.guild.members.me;
      if (me && message.channel.permissionsFor(me).has([PermissionsBitField.Flags.SendMessages, PermissionsBitField.Flags.EmbedLinks])) {
        const botName = client.user.username;
        const embed = new MessageEmbed()
          .setTitle(`Hi, I'm ${botName}. Need help?`)
          .setDescription(`You can see everything I can do by using the \`${prefix}help\` command.`)
          .addField('Commands', `Use \`${prefix}commands\` to view all commands.`)
          .addField('Prefix', `The current prefix for this server is \`${prefix}\`.`)
          .setFooter(`Use ${prefix}help <command> for detailed help.`)
          .setColor(me ? me.displayHexColor : '#7289da');
        message.channel.send({ embeds: [embed] }).catch(() => {});
      }
    }
  }

  // Update points with messagePoints value
  if (pointTracking) {
    client.db.users.updatePoints.run(messagePoints, messagePoints, message.author.id, message.guild.id);
  }
};
