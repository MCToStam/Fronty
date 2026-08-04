const {
  Collection,
  ContainerBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  MessageFlags,
} = require("discord.js");
const log = require("../../../util/module/log");
const config = require("../../../config");
const { translate } = require("../../../util/i18n");

function formatOptions(options = []) {
  return options
    .map((opt) =>
      opt.options?.length
        ? `${opt.name} ${formatOptions(opt.options)}`
        : `<${opt.name}: ${opt.value}>`,
    )
    .join(" ");
}

module.exports = async (client, interaction) => {
  const slashCmd = client.container.slashCmds.get(interaction.commandName);
  if (!slashCmd) return;

  const currentLang = "en-GB";

  if (slashCmd.conf?.disable) {
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
    });
  }

  const { cooldowns } = client;

  if (!cooldowns.has(slashCmd.data.name)) {
    cooldowns.set(slashCmd.data.name, new Collection());
  }

  if (interaction.user.id !== config.owner) {
    const now = Date.now();
    const timestamps = cooldowns.get(slashCmd.data.name);
    const defaultCooldownDuration = 5;
    const cooldownAmount =
      (slashCmd.conf?.cooldown ?? defaultCooldownDuration) * 1000;

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
              `${translate(currentLang, "container.cooldown.description")} <t:${expiredTimestamp}:R>.`,
            ),
          );

        return interaction.reply({
          components: [cooldownContainer],
          flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
        });
      }
    }

    timestamps.set(interaction.user.id, now + cooldownAmount);
  }

  try {
    await slashCmd.execute(client, interaction, config);
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
        });
      }
    } catch (e) {}
    log(e, "error", "red");

    const channel = await client.channels.fetch(config.log_channels.error, {
      allowUnknownGuild: true,
    });

    if (!channel) return;

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
      flags: MessageFlags.IsComponentsV2,
    });
  }

  const channel = await client.channels.fetch(config.log_channels.command, {
    allowUnknownGuild: true,
  });

  if (!channel) return;

  const formattedOptions = formatOptions(interaction.options.data);
  const commandPath = `/${interaction.commandName}${
    formattedOptions ? " " + formattedOptions : ""
  }`;

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
        } (<@${interaction.user.id}>)\n**🔧 ${translate(currentLang, "log.log.value")} :** ${commandPath.replace(/\\/g, "\\\\").replace(/_/g, "\\_")}`,
      ),
    );

  await channel.send({
    components: [logContainer],
    flags: MessageFlags.IsComponentsV2,
    allowedMentions: { parse: [] },
  });
};
