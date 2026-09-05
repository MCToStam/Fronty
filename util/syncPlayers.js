const { OpenFrontAPI } = require("./openfront-api");
const Clan = require("./database/models/Clan");
const Player = require("./database/models/Player");
const log = require("./module/log");

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
    const player = await OpenFrontAPI(
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
    return false;
  } catch (err) {
    log(`Error syncing player ${publicId}: ${err}`, "error", "red");
    return true;
  }
}

async function syncPlayers() {
  log("Retrieving players...", "TASK", "magentaBright");

  const playerIds = await getUniquePlayerIds();

  log(`${playerIds.length} unique players found`, "TASK", "magentaBright");

  for (const playerId of playerIds) {
    if (await syncPlayer(playerId)) return;
  }

  log("Player synchronization complete", "TASK", "magentaBright");
}

module.exports = {
  syncPlayers,
};
