const {
  ContainerBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  MessageFlags,
} = require("discord.js");
const log = require("../../../util/module/log");
const config = require("../../../config");
const { translate } = require("../../../util/i18n");

module.exports = async (client, interaction) => {
  const btn = client.container.buttons.get(interaction.customId.split("-")[0]);
  if (!btn) return;

  const currentLang = "en-GB";

  const originalMessage = interaction?.message?.reference
    ? await interaction.channel.messages.fetch(
        interaction.message.reference.messageId,
      )
    : interaction.message;

  const authorId = originalMessage.interaction?.user?.id;
  if (authorId && interaction.user.id !== authorId && !btn.data.all) {
    const permissionContainer = new ContainerBuilder()
      .setAccentColor(config.colors.error)
      .addTextDisplayComponents((textDisplay) =>
        textDisplay.setContent(
          `## 🚫 ${translate(currentLang, "container.forbidden.title")}`,
        ),
      )
      .addSeparatorComponents((separator) => separator)
      .addTextDisplayComponents((textDisplay) =>
        textDisplay.setContent(
          translate(currentLang, "container.forbidden.description"),
        ),
      );

    return interaction.reply({
      components: [permissionContainer],
      flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
      allowedMentions: { parse: [] },
    });
  }

  try {
    await btn.execute(client, interaction, config);
  } catch (e) {
    const errorContainer = new ContainerBuilder()
      .setAccentColor(config.colors.error)
      .addTextDisplayComponents((textDisplay) =>
        textDisplay.setContent(
          `## ❌ ${translate(currentLang, "container.error.title")}`,
        ),
      )
      .addSeparatorComponents((separator) => separator)
      .addTextDisplayComponents((textDisplay) =>
        textDisplay.setContent(
          translate(currentLang, "container.error.description"),
        ),
      )
      .addSeparatorComponents((separator) => separator)
      .addActionRowComponents(
        new ActionRowBuilder().addComponents(
          new ButtonBuilder()
            .setURL("https://discord.gg/tFkb9nYSd8")
            .setEmoji("1307452239052279858")
            .setLabel(translate(currentLang, "container.error.support_server"))
            .setStyle(ButtonStyle.Link),
        ),
      );

    try {
      if (interaction.deferred || interaction.replied) {
        await interaction.followUp({
          components: [errorContainer],
          flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
        });
      } else {
        await interaction.reply({
          components: [errorContainer],
          flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
          allowedMentions: { parse: [] },
        });
      }
    } catch (e) {}
    log(e, "error", "red");

    const channel = await client.channels.fetch(config.log_channels.error, {
      allowUnknownGuild: true,
    });

    const errorLogContainer = new ContainerBuilder()
      .setAccentColor(config.colors.error)
      .addTextDisplayComponents((textDisplay) =>
        textDisplay.setContent(
          `## ❌ ${translate(currentLang, "log.error.title")}`,
        ),
      )
      .addSeparatorComponents((separator) => separator)
      .addTextDisplayComponents((textDisplay) =>
        textDisplay.setContent(
          `**🔧 ${translate(currentLang, "log.error.action")} :** ${interaction.customId}`,
        ),
      )
      .addTextDisplayComponents((textDisplay) =>
        textDisplay.setContent(
          `**💢 ${translate(currentLang, "log.error.error")} :** \`\`\`${e}\`\`\``,
        ),
      );

    await channel.send({
      components: [errorLogContainer],
      flags: 32768,
      allowedMentions: { parse: [] },
    });
  }

  const channel = await client.channels.fetch(config.log_channels.button, {
    allowUnknownGuild: true,
  });

  if (!channel) return;

  const logContainer = new ContainerBuilder()
    .setAccentColor(config.colors.success)
    .addTextDisplayComponents((textDisplay) =>
      textDisplay.setContent(
        `## 📗 ${translate(currentLang, "log.log.title")}`,
      ),
    )
    .addSeparatorComponents((separator) => separator)
    .addTextDisplayComponents((textDisplay) =>
      textDisplay.setContent(
        `**👷 ${translate(currentLang, "log.log.user")} :** ${
          interaction.user.globalName
            ?.replace(/\\/g, "\\\\")
            .replace(/_/g, "\\_") ||
          interaction.user.username?.replace(/\\/g, "\\\\").replace(/_/g, "\\_")
        } (<@${interaction.user.id}>)\n**🔧 ${translate(currentLang, "log.log.value")} :** ${interaction.customId.replace(/\\/g, "\\\\").replace(/_/g, "\\_")}`,
      ),
    );

  await channel.send({
    components: [logContainer],
    flags: MessageFlags.IsComponentsV2,
    allowedMentions: { parse: [] },
  });
};
