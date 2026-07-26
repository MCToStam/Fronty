const {
  SlashCommandBuilder,
  ContainerBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  MessageFlags,
} = require("discord.js");
const {
  getLocalization,
  getGuildInfo,
  translate,
} = require("../../../util/i18n");
const Map = require("../../../util/database/models/Map");

module.exports = {
  data: new SlashCommandBuilder()
    .setName(translate("en", "commands.map.data.name"))
    .setNameLocalizations(getLocalization("commands.map.data.name"))
    .setDescription(translate("en", "commands.map.data.description"))
    .setDescriptionLocalizations(
      getLocalization("commands.map.data.description"),
    )
    .addStringOption((option) =>
      option
        .setName(translate("en", "commands.map.data.options.name.name"))
        .setNameLocalizations(
          getLocalization("commands.map.data.options.name.name"),
        )
        .setDescription(
          translate("en", "commands.map.data.options.name.description"),
        )
        .setDescriptionLocalizations(
          getLocalization("commands.map.data.options.name.description"),
        )
        .setRequired(true)
        .setAutocomplete(true),
    ),

  async execute(client, interaction, config) {
    const guildInfo = await getGuildInfo(interaction.locale, interaction.guild);
    const currentLang = guildInfo.language;

    const name = interaction.options.getString("name");

    const mapInfo = await Map.findOne({ id: name });

    if (!mapInfo) {
      const errorContainer = new ContainerBuilder()
        .setAccentColor(config.colors.error)
        .addTextDisplayComponents((textDisplay) =>
          textDisplay.setContent(
            `## ❌ ${translate(currentLang, "commands.map.error.undefined.title")}`,
          ),
        )
        .addSeparatorComponents((separator) => separator)
        .addTextDisplayComponents((textDisplay) =>
          textDisplay.setContent(
            translate(currentLang, "commands.map.error.undefined.description"),
          ),
        )
        .addSeparatorComponents((separator) => separator)
        .addActionRowComponents(
          new ActionRowBuilder().addComponents(
            new ButtonBuilder()
              .setURL("https://discord.gg/tFkb9nYSd8")
              .setEmoji("1307452239052279858")
              .setLabel(
                translate(currentLang, "container.error.support_server"),
              )
              .setStyle(ButtonStyle.Link),
          ),
        );

      return await interaction.editReply({
        components: [container],
        flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
      });
    }

    const container = new ContainerBuilder()
      .setAccentColor(config.colors.normal)
      .addTextDisplayComponents((t) =>
        t.setContent(
          `## 🗺️ ${mapInfo.translations.get(currentLang) || mapInfo.id}`,
        ),
      )
      .addSeparatorComponents((s) => s)
      .addSectionComponents((section) =>
        section
          .addTextDisplayComponents((textDisplay) =>
            textDisplay.setContent(
              `**📁 ${mapInfo.categories.length > 1 ? translate(currentLang, "commands.map.category.plural") : translate(currentLang, "commands.map.category.singular")} :** ${mapInfo.categories.join(", ")}\n**✖️ ${translate(currentLang, "commands.map.size")} :** ${mapInfo.map.width}x${mapInfo.map.height}\n**🏳️ ${mapInfo.nations.length > 1 ? translate(currentLang, "commands.map.nation.plural") : translate(currentLang, "commands.map.nation.singular")} :** ${mapInfo.nations.length}`,
            ),
          )
          .setThumbnailAccessory((thumbnail) =>
            thumbnail.setURL(mapInfo.thumbnail),
          ),
      );

    await interaction.reply({
      components: [container],
      flags: MessageFlags.IsComponentsV2,
    });
  },
};
