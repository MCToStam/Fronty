const {
  PermissionFlagsBits,
  ActionRowBuilder,
  StringSelectMenuBuilder,
  ContainerBuilder,
  SlashCommandBuilder,
  MessageFlags,
} = require("discord.js");
const {
  getLocalization,
  getGuildInfo,
  translate,
  availableLanguages,
} = require("../../../util/i18n");

module.exports = {
  data: new SlashCommandBuilder()
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .setContexts(0)
    .setName(translate("en", "commands.configuration.data.name"))
    .setNameLocalizations(getLocalization("commands.configuration.data.name"))
    .setDescription(translate("en", "commands.configuration.data.description"))
    .setDescriptionLocalizations(
      getLocalization("commands.configuration.data.description"),
    ),

  async execute(client, interaction, config) {
    const guildInfo = await getGuildInfo(interaction.locale, interaction.guild);
    const currentLang = guildInfo.language;
    const languages = availableLanguages();

    const container = new ContainerBuilder()
      .setAccentColor(config.colors.normal)
      .addTextDisplayComponents((t) =>
        t.setContent(
          `## 🛠️ ${translate(currentLang, "commands.configuration.title")}`,
        ),
      )
      .addSeparatorComponents((s) => s)
      .addTextDisplayComponents((text) =>
        text.setContent(
          `**${translate(currentLang, "commands.configuration.language.text")} :**`,
        ),
      )
      .addActionRowComponents(
        new ActionRowBuilder().addComponents(
          new StringSelectMenuBuilder()
            .setCustomId("config-language")
            .setPlaceholder(
              translate(currentLang, "commands.configuration.language.select"),
            )
            .addOptions(
              languages.map((lang) => ({
                label: lang.label,
                value: lang.code,
                emoji: lang.flag.replace(/:/g, ""),
                default: lang.code === currentLang,
              })),
            ),
        ),
      );

    await interaction.reply({
      components: [container],
      flags: MessageFlags.IsComponentsV2,
    });
  },
};
