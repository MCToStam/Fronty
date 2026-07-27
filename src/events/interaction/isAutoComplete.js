const { getGuildInfo } = require("../../../util/i18n");
const Clan = require("../../../util/database/models/Clan");
const Map = require("../../../util/database/models/Map");

module.exports = async (client, interaction) => {
  const guildInfo = await getGuildInfo(interaction.locale, interaction.guild);
  const currentLang = guildInfo.language;

  const focusedOption = interaction.options.getFocused(true);

  const input = focusedOption.value.toLowerCase();

  if (focusedOption.name === "tag") {
    const clans = await Clan.find({
      $or: [
        {
          name: {
            $regex: input,
            $options: "i",
          },
        },
        {
          tag: {
            $regex: input,
            $options: "i",
          },
        },
      ],
    })
      .limit(25)
      .lean();

    await interaction.respond(
      clans.map((clan) => ({
        name: `${clan.name} [${clan.tag}]`,
        value: clan.tag,
      })),
    );
  } else if (focusedOption.name === "name") {
    const maps = await Map.find().lean();

    const filteredMaps = maps
      .filter((mapInfo) => {
        if (
          (mapInfo.translations[currentLang] || mapInfo.id)
            .toLowerCase()
            .includes(input)
        )
          return true;
      })
      .slice(0, 25);

    await interaction.respond(
      filteredMaps.map((mapInfo) => ({
        name: mapInfo.translations[currentLang] || mapInfo.id,
        value: mapInfo.id,
      })),
    );
  }
};
