const { OpenFrontAPI } = require("../../../util/openfront-api");

module.exports = async (client, interaction) => {
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
  }
};
