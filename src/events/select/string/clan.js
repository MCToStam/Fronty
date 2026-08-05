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
} = require("../../../../util/i18n");
const { OpenFrontAPI } = require("../../../../util/openfront-api");
const Clan = require("../../../../util/database/models/Clan");

module.exports = {
  data: {
    name: "clan",
  },

  async execute(client, interaction, config) {
    const guildInfo = await getGuildInfo(interaction.locale, interaction.guild);
    const currentLang = guildInfo.language;

    const tag = interaction.customId.split("-")[1];
    const menu = interaction.values[0];

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

      return await interaction.update({
        components: [container],
        flags: MessageFlags.IsComponentsV2,
      });
    }

    const container = new ContainerBuilder()
      .setAccentColor(config.colors.normal)
      .addTextDisplayComponents((t) =>
        t.setContent(`## 🏰 ${clan.name} [${clan.tag}]`),
      )
      .addSeparatorComponents((s) => s);

    if (menu === "home") {
      const creationTimestamp = Math.floor(
        new Date(clan.createdAt).getTime() / 1000,
      );

      container.addTextDisplayComponents((t) =>
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
                .setLabel(
                  translate(currentLang, "commands.clan.discord_server"),
                )
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
    } else if (menu === "members") {
      if (clan.members.length === 0) {
        container.addTextDisplayComponents((t) =>
          t.setContent(
            translate(currentLang, "commands.clan.membersPage.no_data"),
          ),
        );
      } else {
        const leader = clan.members
          .filter((member) => member.role === "leader")
          .map((member) => member.username || member.publicId);

        const officer = clan.members
          .filter((member) => member.role === "officer")
          .map((member) => member.username || member.publicId);

        const member = clan.members
          .filter((member) => member.role === "member")
          .map((member) => member.username || member.publicId);

        const formatMembers = (members, max = 100) => {
          const displayed = members
            .slice(0, 100)
            .map((member) => member.replace(/\./g, "#"))
            .join(", ");

          return members.length > max ? `${displayed}...` : displayed;
        };

        container
          .addTextDisplayComponents((t) =>
            t.setContent(
              `👑 **${leader.length > 1 ? translate(currentLang, "commands.clan.membersPage.leader.title.plural") : translate(currentLang, "commands.clan.membersPage.leader.title.singular")} :**\n${leader.length === 0 ? translate(currentLang, "commands.clan.membersPage.leader.no_data") : formatMembers(leader)}`,
            ),
          )
          .addSeparatorComponents((s) => s)
          .addTextDisplayComponents((t) =>
            t.setContent(
              `🛡️ **${officer.length > 1 ? translate(currentLang, "commands.clan.membersPage.officer.title.plural") : translate(currentLang, "commands.clan.membersPage.officer.title.singular")} (${officer.length}) :**\n${officer.length === 0 ? translate(currentLang, "commands.clan.membersPage.officer.no_data") : formatMembers(officer)}`,
            ),
          )
          .addSeparatorComponents((s) => s)
          .addTextDisplayComponents((t) =>
            t.setContent(
              `👤 **${member.length > 1 ? translate(currentLang, "commands.clan.membersPage.member.title.plural") : translate(currentLang, "commands.clan.membersPage.member.title.singular")} (${member.length}) :**\n${member.length === 0 ? translate(currentLang, "commands.clan.membersPage.member.no_data") : formatMembers(member)}`,
            ),
          );
      }
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
                default: menu === "home",
              },
              {
                label: translate(currentLang, "commands.clan.select.members"),
                value: "members",
                emoji: "👥",
                default: menu === "members",
              },
            ]),
        ),
      );

    await interaction.update({
      components: [container],
      flags: MessageFlags.IsComponentsV2,
    });
  },
};
