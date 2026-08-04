require("dotenv").config({ quiet: true });
const { ShardingManager } = require("discord.js");
const log = require("./util/module/log");

const manager = new ShardingManager("./main.js", {
  token: process.env.DISCORD_TOKEN,
  totalShards:
    !process.env.TOTAL_SHARDS || process.env.TOTAL_SHARDS === "auto"
      ? "auto"
      : Number(process.env.TOTAL_SHARDS),
  mode: "process",
  respawn: true,
});

manager.on("shardCreate", (shard) => {
  log(`🚀 Starting of the shard #${shard.id}`, "SHARD", "cyan");

  shard.on("ready", () => log(`✅ Shard ${shard.id} ready`, "SHARD", "green"));
  shard.on("death", () => log(`💀 Shard ${shard.id} is dead`, "SHARD", "red"));
  shard.on("error", (err) =>
    log(`❌ Error in the shard #${shard.id}: ${err.message}`, "SHARD", "red"),
  );
});

manager.spawn({ timeout: -1 }).catch((err) => {
  log(`❌ Échec du spawn des shards: ${err.message}`, "SHARD", "red");
  process.exit(1);
});
