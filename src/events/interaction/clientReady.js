const { ActivityType } = require("discord.js");
const cron = require("cron");
const log = require("../../../util/module/log");
const updateMaps = require("../../../util/updateMaps");

const evalFn = (c) => ({
  guilds: c.guilds.cache.size,
  members: c.guilds.cache.reduce((a, g) => a + g.memberCount, 0),
});

const sum = (results) =>
  results.reduce(
    (acc, r) => ({
      guilds: acc.guilds + r.guilds,
      members: acc.members + r.members,
    }),
    { guilds: 0, members: 0 },
  );

async function getTotals(client) {
  if (client.machine) {
    try {
      return sum(await client.machine.broadcastEval(evalFn));
    } catch {}
  }

  if (client.cluster) {
    try {
      return sum(await client.cluster.broadcastEval(evalFn));
    } catch {}
  }

  return evalFn(client);
}

function cycleStatus(client) {
  setInterval(async () => {
    try {
      const { guilds, members } = await getTotals(client);
      client.user.setPresence({
        activities: [
          {
            name: `Fronty | /help | ${guilds} server${guilds > 1 ? "s" : ""} and ${members} member${members > 1 ? "s" : ""}`,
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
  client.cluster?.triggerReady();

  const latence = (Date.now() - client.botLaunch) / 1000;
  const tag = client.machine
    ? "Cross-host"
    : `Cluster ${client.cluster?.id ?? 0}`;
  const { guilds, members } = await getTotals(client);

  log(
    `[${tag}] ${client.user.username} is ready in ${latence.toFixed(1)}s. Total bot : ${guilds} server${guilds > 1 ? "s" : ""}, ${members} user${members > 1 ? "s" : ""}.`,
    "READY",
    "green",
  );

  cycleStatus(client);

  if (client.cluster?.id === 0) {
    cron.schedule(
      "0 0 * * *",
      async () => {
        await updateMaps();
      },
      {
        timezone: "Europe/Paris",
      },
    );
  }
};
