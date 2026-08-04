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

    const top = await OpenFrontAPI(
      "https://api.openfront.io/public/clans/leaderboard",
    );

    const creationTimestamp = Math.floor(
      new Date(clan.createdAt).getTime() / 1000,
    );

    const rank = top.clans.findIndex((c) => c.clanTag === clan.tag) + 1;

    const container = new ContainerBuilder()
      .setAccentColor(config.colors.normal)
      .addTextDisplayComponents((t) =>
        t.setContent(`## 🏰 ${clan.name} [${clan.tag}]`),
      )
      .addSeparatorComponents((s) => s)
      .addTextDisplayComponents((t) =>
        t.setContent(
          `${rank ? `**🏆 ${translate(currentLang, "commands.clan.rank")} :** #${rank}\n` : ""}**📌 ${translate(currentLang, "commands.clan.description.title")} : ** ${clan.description || translate(currentLang, "commands.clan.description.nothing")}\n**👥 ${clan.memberCount > 1 ? translate(currentLang, "commands.clan.members.plural") : translate(currentLang, "commands.clan.members.singular")} :** ${clan.memberCount.toLocaleString()}\n**🔓 ${translate(currentLang, "commands.clan.status.title")}** : ${clan.isOpen ? translate(currentLang, "commands.clan.status.open") : translate(currentLang, "commands.clan.status.close")}\n**📅 ${translate(currentLang, "commands.clan.creation")} :** <t:${creationTimestamp}:F> • <t:${creationTimestamp}:R>`,
        ),
      );

    const clanTop = top.clans[rank - 1];
    if (clanTop) {
      container
        .addSeparatorComponents((s) => s)
        .addTextDisplayComponents((t) =>
          t.setContent(
            `🎮 **${clanTop.games > 1 ? translate(currentLang, "commands.clan.stats.games.plural") : translate(currentLang, "commands.clan.stats.games.singular")} :** ${clanTop.games.toLocaleString()}\n🏆 **${clanTop.wins > 1 ? translate(currentLang, "commands.clan.stats.wins.plural") : translate(currentLang, "commands.clan.stats.wins.singular")} :** ${clanTop.wins.toLocaleString()}\n💥 **${clanTop.losses > 1 ? translate(currentLang, "commands.clan.stats.losses.plural") : translate(currentLang, "commands.clan.stats.losses.singular")} :** ${clanTop.losses.toLocaleString()}\n♾️ **${translate(currentLang, "commands.clan.stats.ratio.normal")} :** ${(clanTop.wins / clanTop.losses).toLocaleString()}`,
          ),
        )
        .addTextDisplayComponents((t) =>
          t.setContent(
            `🏆 **${translate(currentLang, "commands.clan.stats.wins.score")} :** ${clanTop.weightedWins.toLocaleString()}\n💥 **${translate(currentLang, "commands.clan.stats.losses.score")} :** ${clanTop.weightedLosses.toLocaleString()}\n♾️ **${translate(currentLang, "commands.clan.stats.ratio.score")} :** ${clanTop.weightedWLRatio.toLocaleString()}`,
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

    await interaction.reply({
      components: [container],
      flags: MessageFlags.IsComponentsV2,
    });
  },
};
