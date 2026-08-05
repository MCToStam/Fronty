const {
  AuditLogEvent,
  ChannelType,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ContainerBuilder,
  MessageFlags,
} = require("discord.js");
const log = require("../../../util/module/log");
const config = require("../../../config");
const { getGuildInfo, translate } = require("../../../util/i18n");

module.exports = async (client, guild) => {
  const currentLang = config.defaultLanguage;

  const channel = client.channels.cache.get(config.log_channels.invitationBot, {
    allowUnknownGuild: true,
  });

  if (channel) {
    let inviter = null;
    if (guild.members.me?.permissions.has("ViewAuditLog")) {
      try {
        const auditLogs = await guild.fetchAuditLogs({
          limit: 1,
          type: AuditLogEvent.BotAdd,
        });
        const botAddLog = auditLogs.entries.find(
          (entry) => entry.target.id === client.user.id,
        );
        if (botAddLog) inviter = botAddLog.executor;
      } catch (err) {
        log(
          `Unable to retrieve audit logs for ${guild.name} : ${err}`,
          "error",
          "red",
        );
      }
    }

    const escapedServerName = guild.name.replace(/_/g, "\\_");
    const creationTimestamp = Math.floor(guild.createdTimestamp / 1000);
    const serverIconURL = guild.iconURL({ dynamic: true, size: 512 });

    const container = new ContainerBuilder()
      .setAccentColor(config.colors.success)
      .addTextDisplayComponents((textDisplay) =>
        textDisplay.setContent(
          `## ✅ ${translate(currentLang, "container.invitation.join.title")}`,
        ),
      )
      .addSeparatorComponents((separator) => separator);

    if (serverIconURL) {
      container.addSectionComponents((section) =>
        section
          .addTextDisplayComponents((textDisplay) =>
            textDisplay.setContent(
              `${client.user.username} ${inviter ? `${translate(currentLang, "container.invitation.join.description1")} <@${inviter?.id}> ${translate(currentLang, "container.invitation.join.description2")} ` : ""}${translate(currentLang, "container.invitation.join.description3")} ${client.guilds.cache.size} ${client.guilds.cache.size > 1 ? translate(currentLang, "container.invitation.guilds.plural") : translate(currentLang, "container.invitation.guilds.singular")}.\n\n> ${translate(currentLang, "container.invitation.name")} : ${escapedServerName}\n> ${guild.memberCount > 1 ? translate(currentLang, "container.invitation.members.plural") : translate(currentLang, "container.invitation.members.singular")} : ${guild.memberCount}\n> ${translate(currentLang, "container.invitation.owner")} : <@${guild.ownerId}>\n> ${translate(currentLang, "container.invitation.creationDate")} : <t:${creationTimestamp}:R>`,
            ),
          )
          .setThumbnailAccessory((thumbnail) =>
            thumbnail.setURL(serverIconURL),
          ),
      );
    } else {
      container.addTextDisplayComponents((textDisplay) =>
        textDisplay.setContent(
          `${client.user.username} ${inviter ? `${translate(currentLang, "container.invitation.join.description1")} <@${inviter?.id}> ${translate(currentLang, "container.invitation.join.description2")} ` : ""}${translate(currentLang, "container.invitation.join.description3")} ${client.guilds.cache.size} ${client.guilds.cache.size > 1 ? translate(currentLang, "container.invitation.guilds.plural") : translate(currentLang, "container.invitation.guilds.singular")}.\n\n> ${translate(currentLang, "container.invitation.name")} : ${escapedServerName}\n> ${guild.memberCount > 1 ? translate(currentLang, "container.invitation.members.plural") : translate(currentLang, "container.invitation.members.singular")} : ${guild.memberCount}\n> ${translate(currentLang, "container.invitation.owner")} : <@${guild.ownerId}>\n> ${translate(currentLang, "container.invitation.creationDate")} : <t:${creationTimestamp}:R>`,
        ),
      );
    }

    await channel.send({
      components: [container],
      flags: MessageFlags.IsComponentsV2,
      allowedMentions: { parse: [] },
    });
  }

  const helpChannel = guild.channels.cache.find(
    (ch) => ch.type === ChannelType.GuildText,
  );
  if (helpChannel) {
    const guildLanguage = await getGuildInfo(currentLang, guild);

    const helpContainer = new ContainerBuilder()
      .setAccentColor(config.colors.normal)
      .addTextDisplayComponents((textDisplay) =>
        textDisplay.setContent(
          `## ℹ️ ${client.user.username} - ${translate(guildLanguage, "container.invitation.help.title")}`,
        ),
      )
      .addSeparatorComponents((separator) => separator)
      .addTextDisplayComponents((textDisplay) =>
        textDisplay.setContent(
          translate(guildLanguage, "container.invitation.help.description"),
        ),
      )
      .addSeparatorComponents((separator) => separator)
      .addActionRowComponents(
        new ActionRowBuilder().addComponents(
          new ButtonBuilder()
            .setURL(config.supportServer)
            .setEmoji("1307452239052279858")
            .setLabel(
              translate(
                guildLanguage,
                "container.invitation.help.support_server",
              ),
            )
            .setStyle(ButtonStyle.Link),
        ),
      );

    await helpChannel.send({
      components: [helpContainer],
      flags: MessageFlags.IsComponentsV2,
    });
  }
};
