const { ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType } = require('discord.js');

async function paginate(interactionOrMessage, pages, timeout = 120000) {
  if (!pages || pages.length === 0) return;
  if (pages.length === 1) {
    if (interactionOrMessage.reply) {
      if (interactionOrMessage.deferred || interactionOrMessage.replied) {
        return interactionOrMessage.editReply({ embeds: [pages[0]], components: [] });
      }
      return interactionOrMessage.reply({ embeds: [pages[0]], components: [] });
    }
    return interactionOrMessage.channel.send({ embeds: [pages[0]] });
  }

  let index = 0;
  const total = pages.length;

  const getButtons = (pageIndex) => {
    return new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('page_first')
        .setLabel('⏮️')
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(pageIndex === 0),
      new ButtonBuilder()
        .setCustomId('page_prev')
        .setLabel('◀️')
        .setStyle(ButtonStyle.Primary)
        .setDisabled(pageIndex === 0),
      new ButtonBuilder()
        .setCustomId('page_counter')
        .setLabel(`Page ${pageIndex + 1}/${total}`)
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(true),
      new ButtonBuilder()
        .setCustomId('page_next')
        .setLabel('▶️')
        .setStyle(ButtonStyle.Primary)
        .setDisabled(pageIndex === total - 1),
      new ButtonBuilder()
        .setCustomId('page_last')
        .setLabel('⏭️')
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(pageIndex === total - 1)
    );
  };

  let msg;
  if (interactionOrMessage.reply) {
    if (interactionOrMessage.deferred || interactionOrMessage.replied) {
      msg = await interactionOrMessage.editReply({
        embeds: [pages[index]],
        components: [getButtons(index)]
      });
    } else {
      msg = await interactionOrMessage.reply({
        embeds: [pages[index]],
        components: [getButtons(index)],
        fetchReply: true
      });
    }
  } else {
    msg = await interactionOrMessage.channel.send({
      embeds: [pages[index]],
      components: [getButtons(index)]
    });
  }

  const authorId = interactionOrMessage.user ? interactionOrMessage.user.id : interactionOrMessage.author.id;
  const collector = msg.createMessageComponentCollector({
    componentType: ComponentType.Button,
    time: timeout
  });

  collector.on('collect', async (btn) => {
    if (btn.user.id !== authorId) {
      return btn.reply({ content: '❌ Only the command author can use these buttons.', ephemeral: true });
    }

    if (btn.customId === 'page_first') index = 0;
    else if (btn.customId === 'page_prev') index = Math.max(0, index - 1);
    else if (btn.customId === 'page_next') index = Math.min(total - 1, index + 1);
    else if (btn.customId === 'page_last') index = total - 1;

    await btn.update({
      embeds: [pages[index]],
      components: [getButtons(index)]
    }).catch(() => {});
  });

  collector.on('end', () => {
    const disabledRow = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId('d1').setLabel('⏮️').setStyle(ButtonStyle.Secondary).setDisabled(true),
      new ButtonBuilder().setCustomId('d2').setLabel('◀️').setStyle(ButtonStyle.Secondary).setDisabled(true),
      new ButtonBuilder().setCustomId('d3').setLabel(`Page ${index + 1}/${total}`).setStyle(ButtonStyle.Secondary).setDisabled(true),
      new ButtonBuilder().setCustomId('d4').setLabel('▶️').setStyle(ButtonStyle.Secondary).setDisabled(true),
      new ButtonBuilder().setCustomId('d5').setLabel('⏭️').setStyle(ButtonStyle.Secondary).setDisabled(true)
    );
    msg.edit({ components: [disabledRow] }).catch(() => {});
  });
}

module.exports = {
  paginate
};
