const { ActivityType } = require("discord.js");
const cron = require("node-cron");
const log = require("../../../util/module/log");

const updateMaps = require("../../../util/updateMaps");
const { syncClans, syncClanStats } = require("../../../util/syncClans");

const evalFn = (c) => ({
  guilds: c.guilds.cache.size,
});

const sum = (results) =>
  results.reduce(
    (acc, r) => ({
      guilds: acc.guilds + r.guilds,
    }),
    { guilds: 0 },
  );

async function getTotals(client) {
  if (client.shard) {
    try {
      return sum(await client.shard.broadcastEval(evalFn));
    } catch {}
  }

  return evalFn(client);
}

function cycleStatus(client) {
  setInterval(async () => {
    try {
      const { guilds } = await getTotals(client);
      client.user.setPresence({
        activities: [
          {
            name: `${client.user.username} | /help | ${guilds} guild${guilds > 1 ? "s" : ""}`,
            type: ActivityType.Watching,
          },
        ],
        status: "online",
      });
    } catch (err) {
      log(`⚠️ Erreur cycleStatus: ${err.message}`, "error", "red");
    }
  }, 60000);
}

module.exports = async (client) => {
  const latence = (Date.now() - client.botLaunch) / 1000;
  const tag = client.shard
    ? `Shard(s) ${client.shard.ids.join(",")}`
    : "No shard";
  const { guilds, members } = await getTotals(client);

  log(
    `[${tag}] ${client.user.username} is ready in ${latence.toFixed(1)}s on ${guilds} guild${guilds > 1 ? "s" : ""}.`,
    "READY",
    "green",
  );

  cycleStatus(client);

  if (!client.shard || client.shard.ids.includes(0)) {
    cron.schedule(
      "0 0 * * *",
      async () => {
        await updateMaps();
      },
      {
        timezone: "Europe/Paris",
      },
    );

    cron.schedule(
      "0 0 * * *",
      async () => {
        await syncClans();
      },
      {
        timezone: "Europe/Paris",
      },
    );

    cron.schedule(
      "0 * * * *",
      async () => {
        await syncClanStats();
      },
      {
        timezone: "Europe/Paris",
      },
    );
  }
};
