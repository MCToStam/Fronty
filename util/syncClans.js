const { OpenFrontAPI } = require("./openfront-api");
const Clan = require("./database/models/Clan");
const log = require("./module/log");

async function getAllClans() {
  log("Retrieving clans...", "TASK", "magentaBright");

  const firstPage = await OpenFrontAPI(
    "https://api.openfront.io/clans?page=1&limit=20",
  );

  let clans = [...firstPage.results];

  const totalPages = Math.ceil(firstPage.total / 20);

  for (let page = 2; page <= totalPages; page++) {
    const data = await OpenFrontAPI(
      `https://api.openfront.io/clans?page=${page}&limit=20`,
    );

    clans.push(...data.results);
  }

  return clans;
}

async function joinClan(tag) {
  return OpenFrontAPI(`https://api.openfront.io/clans/${tag}/join`, {
    method: "POST",
    withRefreshToken: true,
  });
}

async function getClanMembers(tag) {
  const firstPage = await OpenFrontAPI(
    `https://api.openfront.io/clans/${tag}/members?page=1&limit=50&order=asc`,
    {
      withRefreshToken: true,
    },
  );

  let members = [...firstPage.results];

  const totalPages = Math.ceil(firstPage.total / 50);

  for (let page = 2; page <= totalPages; page++) {
    const data = await OpenFrontAPI(
      `https://api.openfront.io/clans/${tag}/members?page=${page}&limit=50&order=asc`,
      {
        withRefreshToken: true,
      },
    );

    members.push(...data.results);
  }

  return members;
}

async function getMembersWithJoinFallback(tag) {
  try {
    const members = await getClanMembers(tag);

    return members;
  } catch (error) {
    await new Promise((resolve) => setTimeout(resolve, 60000));

    try {
      await joinClan(tag);

      const members = await getClanMembers(tag);

      return members;
    } catch (joinError) {
      return [];
    }
  }
}

function formatMembers(members) {
  return members.map((member) => ({
    publicId: member.publicId,
    role: member.role,
    joinedAt: new Date(member.joinedAt),
  }));
}

async function saveClan(clan, members = []) {
  await Clan.findOneAndUpdate(
    {
      tag: clan.tag,
    },
    {
      tag: clan.tag,
      name: clan.name,
      description: clan.description,
      isOpen: clan.isOpen,
      members: members,
      memberCount: clan.memberCount,
      createdAt: new Date(clan.createdAt),
    },

    {
      upsert: true,
    },
  );
}

async function processClan(clan) {
  try {
    let members = [];

    if (clan.isOpen) {
      members = await getMembersWithJoinFallback(clan.tag);
    }

    await saveClan(clan, formatMembers(members));
  } catch (error) {
    console.error(`Erreur clan ${clan.tag}`, error.message);
    await saveClan(clan, []);
  }
}

async function syncClans() {
  const clans = await getAllClans();

  for (const clan of clans) {
    await processClan(clan);
  }

  log("Clan synchronization complete", "TASK", "magentaBright");
}

module.exports = syncClans;
