const {
  ButtonStyle,
  ActionRowBuilder,
  ButtonBuilder,
  ContainerBuilder,
  MessageFlags,
} = require("discord.js");
const {
  getLocalization,
  getGuildInfo,
  translate,
} = require("../../../util/i18n");
const Clan = require("../../../util/database/models/Clan");
const Player = require("../../../util/database/models/Player");

module.exports = {
  data: {
    name: "top_page",
  },

  async execute(client, interaction, config) {
    const [_, page, topType, subCommand] = interaction.customId.split("-");

    const guildInfo = await getGuildInfo(interaction.locale, interaction.guild);
    const currentLang = guildInfo.language;

    const topLabels = {
      clan: {
        memberCount: {
          order: "desc",
          formatter: (v) => `${v.toLocaleString()}`,
        },
        createdAt: {
          order: "asc",
          formatter: (v) => {
            const timestamp = Math.floor(new Date(v).getTime() / 1000);

            return `<t:${timestamp}:F> • <t:${timestamp}:R>`;
          },
        },
        "stats.games": {
          order: "desc",
          formatter: (v) => `${v.toLocaleString()}`,
        },
        "stats.wins": {
          order: "desc",
          formatter: (v) => `${v.toLocaleString()}`,
        },
        "stats.losses": {
          order: "desc",
          formatter: (v) => `${v.toLocaleString()}`,
        },
        "stats.weightedWins": {
          order: "desc",
          formatter: (v) => `${v.toLocaleString()}`,
        },
        "stats.weightedLosses": {
          order: "desc",
          formatter: (v) => `${v.toLocaleString()}`,
        },
        "stats.weightedWLRatio": {
          order: "desc",
          formatter: (v) => `${v.toLocaleString()}`,
        },
      },
      player: {
        createdAt: {
          order: "asc",
          formatter: (v) => {
            const timestamp = Math.floor(new Date(v).getTime() / 1000);

            return `<t:${timestamp}:F> • <t:${timestamp}:R>`;
          },
        },
      },
    };

    const modelMap = {
      [translate("en", "commands.top.data.subcommands.clan.name")]: Clan,
      [translate("en", "commands.top.data.subcommands.player.name")]: Player,
    };
    const model = modelMap[subCommand];

    const sortOrder = topLabels[subCommand][topType].order === "desc" ? -1 : 1;

    const currentPage = Number(page);
    const itemsPerPage = 10;

    const [pageData, totalCount] = await Promise.all([
      model.aggregate([
        { $sort: { [topType]: sortOrder } },
        { $skip: currentPage * itemsPerPage },
        { $limit: itemsPerPage },
      ]),

      model.countDocuments(),
    ]);

    const { order = "desc", formatter = (v) => v } =
      topLabels[subCommand][topType] || {};

    const totalPages = Math.ceil(totalCount / itemsPerPage);

    const container = new ContainerBuilder()
      .setAccentColor(config.colors.normal)
      .addTextDisplayComponents((t) =>
        t.setContent(
          `## 🏆 ${translate(currentLang, "commands.top.top")} - ${translate(
            currentLang,
            `commands.top.data.subcommands.${subCommand}.options.type.choices.${topType}`,
          )}`,
        ),
      )
      .addSeparatorComponents((s) => s)
      .addTextDisplayComponents((t) =>
        t.setContent(
          pageData.length
            ? pageData
                .map(
                  (item, idx) =>
                    `**#${currentPage * itemsPerPage + idx + 1} ${
                      item.name ||
                      (typeof item.username === "string" &&
                      item.username.length > 0 &&
                      !item.username.includes(".")
                        ? `<:verified:1536780978775654480> ${item.username}`
                        : item.username?.replace(/\./g, "#") || item.publicId)
                    }**\n↪ ${formatter(topType.split(".").reduce((acc, key) => acc?.[key], item))}`,
                )
                .join("\n")
            : translate(currentLang, "commands.top.no_data"),
        ),
      )
      .addSeparatorComponents((s) => s)
      .addActionRowComponents(
        new ActionRowBuilder().addComponents(
          new ButtonBuilder()
            .setCustomId(`top_page-0-${topType}-${subCommand}-min`)
            .setEmoji("⏪")
            .setDisabled(currentPage <= 0)
            .setStyle(ButtonStyle.Primary),
          new ButtonBuilder()
            .setCustomId(`top_page-${currentPage - 1}-${topType}-${subCommand}`)
            .setEmoji("◀️")
            .setDisabled(currentPage <= 0)
            .setStyle(ButtonStyle.Primary),
          new ButtonBuilder()
            .setCustomId("top_page_status")
            .setLabel(
              `${translate(currentLang, "commands.top.page")} ${currentPage + 1}/${totalPages || 1}`,
            )
            .setDisabled(true)
            .setStyle(ButtonStyle.Secondary),
          new ButtonBuilder()
            .setCustomId(`top_page-${currentPage + 1}-${topType}-${subCommand}`)
            .setEmoji("▶️")
            .setStyle(ButtonStyle.Primary)
            .setDisabled(totalPages <= 1),
          new ButtonBuilder()
            .setCustomId(
              `top_page-${totalPages - 1}-${topType}-${subCommand}-max`,
            )
            .setEmoji("⏩")
            .setStyle(ButtonStyle.Primary)
            .setDisabled(totalPages <= 1),
        ),
      );

    await interaction.update({
      components: [container],
      flags: MessageFlags.IsComponentsV2,
    });
  },
};
