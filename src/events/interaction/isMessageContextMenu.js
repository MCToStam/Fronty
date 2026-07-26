const {
  ContainerBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  MessageFlags,
  Collection,
} = require("discord.js");
const log = require("../../../util/module/log");
const config = require("../../../config");
const { translate } = require("../../../util/i18n");

module.exports = async (client, interaction) => {
  const msgCmd = client.container.msgCmds.get(interaction.commandName);
  if (!msgCmd) return;

  const currentLang = "en-GB";

  if (msgCmd.conf?.disable) {
    const disabledContainer = new ContainerBuilder()
      .setAccentColor(config.colors.error)
      .addTextDisplayComponents((textDisplay) =>
        textDisplay.setContent(
          `## ❌ ${translate(currentLang, "container.disable.title")}`,
        ),
      )
      .addSeparatorComponents((separator) => separator)
      .addTextDisplayComponents((textDisplay) =>
        textDisplay.setContent(
          translate(currentLang, "container.disable.description"),
        ),
      );

    return interaction.reply({
      components: [disabledContainer],
      flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
      allowedMentions: { parse: [] },
    });
  }

  const { cooldowns } = client;

  if (!cooldowns.has(msgCmd.data.name)) {
    cooldowns.set(msgCmd.data.name, new Collection());
  }

  if (interaction.user.id !== config.owner) {
    const now = Date.now();
    const timestamps = cooldowns.get(msgCmd.data.name);
    const defaultCooldownDuration = 5;
    const cooldownAmount =
      (msgCmd.conf?.cooldown ?? defaultCooldownDuration) * 1000;

    if (timestamps.has(interaction.user.id)) {
      const expirationTime =
        timestamps.get(interaction.user.id) + cooldownAmount;

      if (now < expirationTime) {
        const expiredTimestamp = Math.round(expirationTime / 1000);
        const cooldownContainer = new ContainerBuilder()
          .setAccentColor(config.colors.error)
          .addTextDisplayComponents((textDisplay) =>
            textDisplay.setContent(
              `## ❌ ${translate(currentLang, "container.cooldown.title")}`,
            ),
          )
          .addSeparatorComponents((separator) => separator)
          .addTextDisplayComponents((textDisplay) =>
            textDisplay.setContent(
              `## ❌ ${translate(currentLang, "container.cooldown.description")} <t:${expiredTimestamp}:R>.`,
            ),
          );

        return interaction.reply({
          components: [cooldownContainer],
          flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
          allowedMentions: { parse: [] },
        });
      }
    }

    timestamps.set(interaction.user.id, now + cooldownAmount);
  }

  try {
    await msgCmd.execute(client, interaction);
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
          `**🔧 ${translate(currentLang, "log.error.action")} :** ${interaction.commandName}`,
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

  const channel = await client.channels.fetch(config.log_channels.command, {
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
        } (<@${interaction.user.id}>)\n**🔧 ${translate(currentLang, "log.log.value")} :** ${interaction.commandName.replace(/\\/g, "\\\\").replace(/_/g, "\\_")}`,
      ),
    );

  await channel.send({
    components: [logContainer],
    flags: MessageFlags.IsComponentsV2,
    allowedMentions: { parse: [] },
  });
};
