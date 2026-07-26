const { getGuildInfo } = require("../../../util/i18n");
const { OpenFrontAPI } = require("../../../util/openfront-api");
const Map = require("../../../util/database/models/Map");

module.exports = async (client, interaction) => {
  const guildInfo = await getGuildInfo(interaction.locale, interaction.guild);
  const currentLang = guildInfo.language;

  const focusedOption = interaction.options.getFocused(true);

  const input = focusedOption.value.toLowerCase();

  if (focusedOption.name === "tag") {
    const limit = 20;

    const data = await OpenFrontAPI(
      `https://api.openfront.io/clans?page=1&limit=${limit}`,
    );

    let clans = [...data.results];

    const totalPages = Math.ceil(data.total / limit);

    if (totalPages > 1) {
      const requests = [];

      for (let page = 2; page <= totalPages; page++) {
        requests.push(
          OpenFrontAPI(
            `https://api.openfront.io/clans?page=${page}&limit=${limit}`,
          ),
        );
      }

      const pages = await Promise.all(requests);

      for (const page of pages) {
        clans.push(...page.results);
      }
    }

    const filteredClans = clans
      .filter(
        (clan) =>
          clan.name.toLowerCase().includes(input) ||
          clan.tag.toLowerCase().includes(input),
      )
      .slice(0, 25);

    await interaction.respond(
      filteredClans.map((clan) => ({
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
