const { OpenFrontAPI } = require("../util/openfront-api");
const Clan = require("../util/database/models/Clan");
const log = require("../util/module/log");

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
    username: member.username,
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
      discordUrl: clan.discordUrl,
      memberCount: clan.memberCount,
      createdAt: new Date(clan.createdAt),
    },

    {
      upsert: true,
    },
  );
}

async function processClan(clanTag) {
  try {
    const clan = await OpenFrontAPI(
      `https://api.openfront.io/clans/${clanTag}`,
    );

    let members = [];

    if (clan.isOpen) {
      members = await getMembersWithJoinFallback(clan.tag);
    }

    await saveClan(clan, formatMembers(members));
  } catch (err) {
    log(`Error with clan ${clanTag} : ${err}`, "error", "red");
  }
}

async function syncClans() {
  const clans = await getAllClans();

  const apiClanTags = clans.map((clan) => clan.tag);

  await Clan.deleteMany({
    tag: { $nin: apiClanTags },
  });

  for (const clan of clans) {
    await processClan(clan.tag);
  }

  log("Clan synchronization complete", "TASK", "magentaBright");
}

async function syncClanStats() {
  log("Retrieving clan leaderboard...", "TASK", "magentaBright");

  const data = await OpenFrontAPI(
    "https://api.openfront.io/public/clans/leaderboard",
  );

  const statsByClan = new Map(
    data.clans.map((clan) => [
      clan.clanTag,
      {
        games: clan.games,
        wins: clan.wins,
        losses: clan.losses,
        playerSessions: clan.playerSessions,
        weightedWins: clan.weightedWins,
        weightedLosses: clan.weightedLosses,
        weightedWLRatio: clan.weightedWLRatio,
        start: new Date(data.start),
        end: new Date(data.end),
      },
    ]),
  );

  const clans = await Clan.find();

  for (const clan of clans) {
    const stats = statsByClan.get(clan.tag);

    await Clan.updateOne(
      {
        tag: clan.tag,
      },
      {
        $set: {
          stats: stats
            ? {
                available: true,
                ...stats,
              }
            : {
                available: false,
              },
        },
      },
    );
  }

  log("Clan stats synchronization complete", "TASK", "magentaBright");
}

module.exports = { syncClans, syncClanStats };
