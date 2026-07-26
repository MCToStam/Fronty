require("dotenv").config({ quiet: true });
const { ClusterManager } = require("discord-hybrid-sharding");
const log = require("./util/module/log");

const CROSS_HOST = process.env.CROSS_HOST === "true";

function attachLogs(manager) {
  manager.on("clusterCreate", (cluster) => {
    log(`🚀 Starting of the cluster #${cluster.id}`, "CLUSTER", "cyan");
    cluster.on("ready", () =>
      log(`✅ Cluster ${cluster.id} ready`, "CLUSTER", "green"),
    );
    cluster.on("death", () =>
      log(`💀 Cluster ${cluster.id} is dead`, "CLUSTER", "red"),
    );
    cluster.on("error", (err) =>
      log(
        `❌ Error in the cluster #${cluster.id + 1}: ${err.message}`,
        "CLUSTER",
        "red",
      ),
    );
  });
}

if (!CROSS_HOST) {
  const manager = new ClusterManager("./main.js", {
    token: process.env.DISCORD_TOKEN,
    totalShards:
      process.env.TOTAL_SHARDS === "auto"
        ? "auto"
        : Number(process.env.TOTAL_SHARDS),
    shardsPerClusters: process.env.SHARDS_PER_CLUSTER
      ? Number(process.env.SHARDS_PER_CLUSTER)
      : 2,
    totalClusters:
      process.env.TOTAL_CLUSTERS === "auto"
        ? "auto"
        : Number(process.env.TOTAL_CLUSTERS),
    mode: "process",
    respawn: true,
  });

  attachLogs(manager);

  manager.spawn({ timeout: -1 }).catch((err) => {
    log(`❌ Échec du spawn des clusters: ${err.message}`, "CLUSTER", "red");
    process.exit(1);
  });
} else {
  const { Client } = require("discord-cross-hosting");

  const bridge = new Client({
    agent: "bot",
    host: process.env.BRIDGE_HOST,
    port: Number(process.env.BRIDGE_PORT) || 4444,
    authToken: process.env.BRIDGE_AUTH_TOKEN,
    retries: 360,
    rollingRestarts: true,
  });

  bridge.on("debug", (msg) => log(`[Bridge-Client] ${msg}`, "LOG", "gray"));
  bridge.on("error", (err) =>
    log(`❌ [Bridge-Client] ${err.message}`, "error", "red"),
  );
  bridge.connect();

  const manager = new ClusterManager("./main.js", {
    token: process.env.DISCORD_TOKEN,
    totalShards: 1,
    totalClusters: "auto",
    mode: "process",
    respawn: true,
  });

  attachLogs(manager);
  bridge.listen(manager);

  bridge
    .requestShardData()
    .then((data) => {
      if (!data?.shardList) {
        log(
          "❌ Le Bridge n'a renvoyé aucune donnée de sharding.",
          "CLUSTER",
          "red",
        );
        return;
      }
      manager.totalShards = data.totalShards;
      manager.totalClusters = data.shardList.length;
      manager.shardList = data.shardList;
      manager.clusterList = data.clusterList;
      manager.spawn({ timeout: -1 });
    })
    .catch((err) =>
      log(
        `❌ Impossible de récupérer les shards depuis le Bridge: ${err.message}`,
        "CLUSTER",
        "red",
      ),
    );
}
