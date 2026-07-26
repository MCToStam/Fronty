const {
  ActionRowBuilder,
  StringSelectMenuBuilder,
  ContainerBuilder,
  MessageFlags,
} = require("discord.js");
const {
  getGuildInfo,
  setGuildInfo,
  translate,
  availableLanguages,
} = require("../../../../util/i18n");

module.exports = {
  data: {
    name: "config",
  },

  async execute(client, interaction, config) {
    const chooseLanguage = interaction.values[0];
    setGuildInfo(interaction.guildId, {
      language: chooseLanguage,
    });
    const guildInfo = await getGuildInfo(interaction.locale, interaction.guild);
    const languages = availableLanguages();

    const container = new ContainerBuilder()
      .setAccentColor(config.colors.normal)
      .addTextDisplayComponents((t) =>
        t.setContent(
          `## 🛠️ ${translate(chooseLanguage, "commands.configuration.title")}`,
        ),
      )
      .addSeparatorComponents((s) => s)
      .addTextDisplayComponents((text) =>
        text.setContent(
          `**${translate(chooseLanguage, "commands.configuration.language.text")} :**`,
        ),
      )
      .addActionRowComponents(
        new ActionRowBuilder().addComponents(
          new StringSelectMenuBuilder()
            .setCustomId("config-language")
            .setPlaceholder(
              translate(
                chooseLanguage,
                "commands.configuration.language.select",
              ),
            )
            .addOptions(
              languages.map((lang) => ({
                label: lang.label,
                value: lang.code,
                emoji: lang.flag.replace(/:/g, ""),
                default: lang.code === chooseLanguage,
              })),
            ),
        ),
      );

    await interaction.update({
      components: [container],
      flags: MessageFlags.IsComponentsV2,
    });
  },
};
