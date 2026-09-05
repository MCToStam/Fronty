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
const Clan = require("../../../util/database/models/Clan");
const Player = require("../../../util/database/models/Player");

module.exports = {
  data: new SlashCommandBuilder()
    .setName(translate("en", "commands.top.data.name"))
    .setNameLocalizations(getLocalization("commands.top.data.name"))
    .setDescription(translate("en", "commands.top.data.description"))
    .setDescriptionLocalizations(
      getLocalization("commands.top.data.description"),
    )
    .addSubcommand((sub) =>
      sub
        .setName(translate("en", "commands.top.data.subcommands.clan.name"))
        .setNameLocalizations(
          getLocalization("commands.top.data.subcommands.clan.name"),
        )
        .setDescription(
          translate("en", "commands.top.data.subcommands.clan.description"),
        )
        .setDescriptionLocalizations(
          getLocalization("commands.top.data.clan.description"),
        )
        .addStringOption((o) =>
          o
            .setName(
              translate(
                "en",
                "commands.top.data.subcommands.clan.options.type.name",
              ),
            )
            .setNameLocalizations(
              getLocalization(
                "commands.top.data.subcommands.clan.options.type.name",
              ),
            )
            .setDescription(
              translate(
                "en",
                "commands.top.data.subcommands.clan.options.type.description",
              ),
            )
            .setDescriptionLocalizations(
              getLocalization(
                "commands.top.data.subcommands.clan.options.type.description",
              ),
            )
            .setRequired(true)
            .addChoices(
              {
                name: translate(
                  "en",
                  "commands.top.data.subcommands.clan.options.type.choices.createdAt",
                ),
                name_localizations: getLocalization(
                  "commands.top.data.subcommands.clan.options.type.choices.createdAt",
                ),
                value: "createdAt",
              },
              {
                name: translate(
                  "en",
                  "commands.top.data.subcommands.clan.options.type.choices.memberCount",
                ),
                name_localizations: getLocalization(
                  "commands.top.data.subcommands.clan.options.type.choices.memberCount",
                ),
                value: "memberCount",
              },
              {
                name: translate(
                  "en",
                  "commands.top.data.subcommands.clan.options.type.choices.stats.games",
                ),
                name_localizations: getLocalization(
                  "commands.top.data.subcommands.clan.options.type.choices.stats.games",
                ),
                value: "stats.games",
              },
              {
                name: translate(
                  "en",
                  "commands.top.data.subcommands.clan.options.type.choices.stats.wins",
                ),
                name_localizations: getLocalization(
                  "commands.top.data.subcommands.clan.options.type.choices.stats.wins",
                ),
                value: "stats.wins",
              },
              {
                name: translate(
                  "en",
                  "commands.top.data.subcommands.clan.options.type.choices.stats.losses",
                ),
                name_localizations: getLocalization(
                  "commands.top.data.subcommands.clan.options.type.choices.stats.losses",
                ),
                value: "stats.losses",
              },
              {
                name: translate(
                  "en",
                  "commands.top.data.subcommands.clan.options.type.choices.stats.weightedWins",
                ),
                name_localizations: getLocalization(
                  "commands.top.data.subcommands.clan.options.type.choices.stats.weightedWins",
                ),
                value: "stats.weightedWins",
              },
              {
                name: translate(
                  "en",
                  "commands.top.data.subcommands.clan.options.type.choices.stats.weightedLosses",
                ),
                name_localizations: getLocalization(
                  "commands.top.data.subcommands.clan.options.type.choices.stats.weightedLosses",
                ),
                value: "stats.weightedLosses",
              },
              {
                name: translate(
                  "en",
                  "commands.top.data.subcommands.clan.options.type.choices.stats.weightedWLRatio",
                ),
                name_localizations: getLocalization(
                  "commands.top.data.subcommands.clan.options.type.choices.stats.weightedWLRatio",
                ),
                value: "stats.weightedWLRatio",
              },
            ),
        ),
    )
    .addSubcommand((sub) =>
      sub
        .setName(translate("en", "commands.top.data.subcommands.player.name"))
        .setNameLocalizations(
          getLocalization("commands.top.data.subcommands.player.name"),
        )
        .setDescription(
          translate("en", "commands.top.data.subcommands.player.description"),
        )
        .setDescriptionLocalizations(
          getLocalization("commands.top.data.player.description"),
        )
        .addStringOption((o) =>
          o
            .setName(
              translate(
                "en",
                "commands.top.data.subcommands.player.options.type.name",
              ),
            )
            .setNameLocalizations(
              getLocalization(
                "commands.top.data.subcommands.player.options.type.name",
              ),
            )
            .setDescription(
              translate(
                "en",
                "commands.top.data.subcommands.player.options.type.description",
              ),
            )
            .setDescriptionLocalizations(
              getLocalization(
                "commands.top.data.subcommands.player.options.type.description",
              ),
            )
            .setRequired(true)
            .addChoices({
              name: translate(
                "en",
                "commands.top.data.subcommands.player.options.type.choices.createdAt",
              ),
              name_localizations: getLocalization(
                "commands.top.data.subcommands.player.options.type.choices.createdAt",
              ),
              value: "createdAt",
            }),
        ),
    ),

  async execute(client, interaction, config) {
    const guildInfo = await getGuildInfo(interaction.locale, interaction.guild);
    const currentLang = guildInfo.language;

    const subCommand = interaction.options.getSubcommand();
    const topType = interaction.options.getString(
      translate("en", "commands.top.data.subcommands.clan.options.type.name"),
    );

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

    const currentPage = 0;
    const itemsPerPage = 10;

    const [pageData, totalCount] = await Promise.all([
      model.aggregate([
        { $sort: { [topType]: sortOrder } },
        { $skip: currentPage * itemsPerPage },
        { $limit: itemsPerPage },
      ]),

      model.countDocuments(),
    ]);

    const { formatter = (v) => v } = topLabels[subCommand][topType] || {};

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

    await interaction.reply({
      components: [container],
      flags: MessageFlags.IsComponentsV2,
    });
  },
};
