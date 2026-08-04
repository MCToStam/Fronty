const { AuditLogEvent, ContainerBuilder, MessageFlags } = require("discord.js");
const config = require("../../../config");
const { translate } = require("../../../util/i18n");

module.exports = async (client, guild) => {
  const currentLang = "en-GB";

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
      console.warn(
        `Impossible de récupérer les logs d'audit pour ${guild.name} :`,
        err.message,
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
            `${client.user.username} ${inviter ? `${translate(currentLang, "container.invitation.join.description1")} <@${inviter?.id}> ${translate(currentLang, "container.invitation.join.description2")} ` : ""}${translate(currentLang, "container.invitation.join.description3")} ${client.guilds.cache.size} ${client.guilds.cache.size > 1 ? translate(currentLang, "container.invitation.guilds.plural") : translate(currentLang, "container.invitation.guilds.singular")}.\n\n> ${translate(currentLang, "container.invitation.name")} : ${escapedServerName}\n> Membre${guild.memberCount > 1 ? translate(currentLang, "container.invitation.members.plural") : translate(currentLang, "container.invitation.members.singular")} : ${guild.memberCount}\n> ${translate(currentLang, "container.invitation.owner")} : <@${guild.ownerId}>\n> ${translate(currentLang, "container.invitation.creationDate")} : <t:${creationTimestamp}:R>`,
          ),
        )
        .setThumbnailAccessory((thumbnail) => thumbnail.setURL(serverIconURL)),
    );
  } else {
    container.addTextDisplayComponents((textDisplay) =>
      textDisplay.setContent(
        `${client.user.username} ${inviter ? `${translate(currentLang, "container.invitation.join.description1")} <@${inviter?.id}> ${translate(currentLang, "container.invitation.join.description2")} ` : ""}${translate(currentLang, "container.invitation.join.description3")} ${client.guilds.cache.size} ${client.guilds.cache.size > 1 ? translate(currentLang, "container.invitation.guilds.plural") : translate(currentLang, "container.invitation.guilds.singular")}.\n\n> ${translate(currentLang, "container.invitation.name")} : ${escapedServerName}\n> Membre${guild.memberCount > 1 ? translate(currentLang, "container.invitation.members.plural") : translate(currentLang, "container.invitation.members.singular")} : ${guild.memberCount}\n> ${translate(currentLang, "container.invitation.owner")} : <@${guild.ownerId}>\n> ${translate(currentLang, "container.invitation.creationDate")} : <t:${creationTimestamp}:R>`,
      ),
    );
  }

  const channel = client.channels.cache.get(config.log_channels.invitationBot, {
    allowUnknownGuild: true,
  });

  if (!channel) return;

  channel.send({
    components: [container],
    flags: MessageFlags.IsComponentsV2,
    allowedMentions: { parse: [] },
  });
};
