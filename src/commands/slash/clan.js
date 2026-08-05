const {
  SlashCommandBuilder,
  ContainerBuilder,
  ActionRowBuilder,
  StringSelectMenuBuilder,
  ButtonBuilder,
  ButtonStyle,
  MessageFlags,
} = require("discord.js");
const {
  getLocalization,
  getGuildInfo,
  translate,
} = require("../../../util/i18n");
const { OpenFrontAPI } = require("../../../util/openfront-api");
const Clan = require("../../../util/database/models/Clan");

module.exports = {
  data: new SlashCommandBuilder()
    .setName(translate("en", "commands.clan.data.name"))
    .setNameLocalizations(getLocalization("commands.clan.data.name"))
    .setDescription(translate("en", "commands.clan.data.description"))
    .setDescriptionLocalizations(
      getLocalization("commands.clan.data.description"),
    )
    .addStringOption((option) =>
      option
        .setName(translate("en", "commands.clan.data.options.tag.name"))
        .setNameLocalizations(
          getLocalization("commands.clan.data.options.tag.name"),
        )
        .setDescription(
          translate("en", "commands.clan.data.options.tag.description"),
        )
        .setDescriptionLocalizations(
          getLocalization("commands.clan.data.options.tag.description"),
        )
        .setRequired(true)
        .setAutocomplete(true),
    ),

  async execute(client, interaction, config) {
    const guildInfo = await getGuildInfo(interaction.locale, interaction.guild);
    const currentLang = guildInfo.language;

    const tag = interaction.options.getString("tag").toUpperCase();

    const clan = await Clan.findOne({ tag: tag });

    if (!clan) {
      const errorContainer = new ContainerBuilder()
        .setAccentColor(config.colors.error)
        .addTextDisplayComponents((textDisplay) =>
          textDisplay.setContent(
            `## ❌ ${translate(currentLang, "commands.clan.error.undefined.title")}`,
          ),
        )
        .addSeparatorComponents((separator) => separator)
        .addTextDisplayComponents((textDisplay) =>
          textDisplay.setContent(
            translate(currentLang, "commands.clan.error.undefined.description"),
          ),
        );

      return await interaction.reply({
        components: [container],
        flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
      });
    }

    const creationTimestamp = Math.floor(
      new Date(clan.createdAt).getTime() / 1000,
    );

    const container = new ContainerBuilder()
      .setAccentColor(config.colors.normal)
      .addTextDisplayComponents((t) =>
        t.setContent(`## 🏰 ${clan.name} [${clan.tag}]`),
      )
      .addSeparatorComponents((s) => s)
      .addTextDisplayComponents((t) =>
        t.setContent(
          `**📌 ${translate(currentLang, "commands.clan.description.title")} : ** ${clan.description || translate(currentLang, "commands.clan.description.nothing")}\n**👥 ${clan.memberCount > 1 ? translate(currentLang, "commands.clan.members.plural") : translate(currentLang, "commands.clan.members.singular")} :** ${clan.memberCount.toLocaleString()}\n**🔓 ${translate(currentLang, "commands.clan.status.title")}** : ${clan.isOpen ? translate(currentLang, "commands.clan.status.open") : translate(currentLang, "commands.clan.status.close")}\n**📅 ${translate(currentLang, "commands.clan.creation")} :** <t:${creationTimestamp}:F> • <t:${creationTimestamp}:R>`,
        ),
      );

    if (clan.stats) {
      container
        .addSeparatorComponents((s) => s)
        .addTextDisplayComponents((t) =>
          t.setContent(
            `🎮 **${clan.stats.games > 1 ? translate(currentLang, "commands.clan.stats.games.plural") : translate(currentLang, "commands.clan.stats.games.singular")} :** ${clan.stats.games.toLocaleString()}\n🏆 **${clan.stats.wins > 1 ? translate(currentLang, "commands.clan.stats.wins.plural") : translate(currentLang, "commands.clan.stats.wins.singular")} :** ${clan.stats.wins.toLocaleString()}\n💥 **${clan.stats.losses > 1 ? translate(currentLang, "commands.clan.stats.losses.plural") : translate(currentLang, "commands.clan.stats.losses.singular")} :** ${clan.stats.losses.toLocaleString()}\n♾️ **${translate(currentLang, "commands.clan.stats.ratio.normal")} :** ${(clan.stats.wins / clan.stats.losses).toLocaleString()}`,
          ),
        )
        .addTextDisplayComponents((t) =>
          t.setContent(
            `🏆 **${translate(currentLang, "commands.clan.stats.wins.score")} :** ${clan.stats.weightedWins.toLocaleString()}\n💥 **${translate(currentLang, "commands.clan.stats.losses.score")} :** ${clan.stats.weightedLosses.toLocaleString()}\n♾️ **${translate(currentLang, "commands.clan.stats.ratio.score")} :** ${clan.stats.weightedWLRatio.toLocaleString()}`,
          ),
        );
    }

    if (clan.discordUrl) {
      container
        .addSeparatorComponents((s) => s)
        .addActionRowComponents(
          new ActionRowBuilder().addComponents(
            new ButtonBuilder()
              .setURL(clan.discordUrl)
              .setLabel(translate(currentLang, "commands.clan.discord_server"))
              .setEmoji("1526578070088192080")
              .setStyle(ButtonStyle.Link),
            new ButtonBuilder()
              .setURL(
                `https://openfront.io/#modal=clan&tab=overview&clan=${clan.tag}`,
              )
              .setLabel(translate(currentLang, "commands.clan.join"))
              .setEmoji("➕")
              .setStyle(ButtonStyle.Link),
          ),
        );
    } else {
      container
        .addSeparatorComponents((s) => s)
        .addActionRowComponents(
          new ActionRowBuilder().addComponents(
            new ButtonBuilder()
              .setURL(
                `https://openfront.io/#modal=clan&tab=overview&clan=${clan.tag}`,
              )
              .setLabel(translate(currentLang, "commands.clan.join"))
              .setEmoji("➕")
              .setStyle(ButtonStyle.Link),
          ),
        );
    }

    container
      .addSeparatorComponents((s) => s)
      .addActionRowComponents(
        new ActionRowBuilder().addComponents(
          new StringSelectMenuBuilder()
            .setCustomId(`clan-${tag}`)
            .setPlaceholder(
              translate(currentLang, "commands.clan.select.placeholder"),
            )
            .addOptions([
              {
                label: translate(currentLang, "commands.clan.select.home"),
                value: "home",
                emoji: "🛖",
                default: true,
              },
              {
                label: translate(currentLang, "commands.clan.select.members"),
                value: "members",
                emoji: "👥",
              },
            ]),
        ),
      );

    await interaction.reply({
      components: [container],
      flags: MessageFlags.IsComponentsV2,
    });
  },
};
