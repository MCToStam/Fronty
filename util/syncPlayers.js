const { OpenFrontAPI } = require("./openfront-api");
const Clan = require("./database/models/Clan");
const Player = require("./database/models/Player");
const log = require("./module/log");

let lastRequestTime = 0;
let requestQueue = Promise.resolve();
const MIN_REQUEST_INTERVAL = 300;

async function apiRequest(url) {
  requestQueue = requestQueue.then(async () => {
    const now = Date.now();

    const waitTime = MIN_REQUEST_INTERVAL - (now - lastRequestTime);

    if (waitTime > 0) {
      await new Promise((resolve) => setTimeout(resolve, waitTime));
    }

    lastRequestTime = Date.now();

    return OpenFrontAPI(url);
  });

  return requestQueue;
}

async function getUniquePlayerIds() {
  const result = await Clan.aggregate([
    {
      $unwind: "$members",
    },
    {
      $group: {
        _id: "$members.publicId",
      },
    },
  ]);

  return result.map((player) => player._id);
}

async function syncPlayer(publicId) {
  try {
    const player = await apiRequest(
      `https://api.openfront.io/public/player/${publicId}`,
    );

    await Player.updateOne(
      {
        publicId,
      },
      {
        $set: {
          publicId: player.publicId,
          username: player.username,
          createdAt: new Date(player.createdAt),
          stats: player.stats,
          clans: player.clans,
        },
      },
      {
        upsert: true,
      },
    );
  } catch (err) {
    log(`Error syncing player ${publicId}: ${err}`, "error", "red");
  }
}

async function syncPlayers() {
  log("Retrieving players...", "TASK", "magentaBright");

  const playerIds = await getUniquePlayerIds();

  log(`${playerIds.length} unique players found`, "TASK", "magentaBright");

  for (const playerId of playerIds) {
    await syncPlayer(playerId);
  }

  log("Player synchronization complete", "TASK", "magentaBright");
}

module.exports = {
  syncPlayers,
};
