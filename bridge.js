require("dotenv").config({ quiet: true });
const { Bridge } = require("discord-cross-hosting");
const log = require("./util/module/log");

const server = new Bridge({
  port: Number(process.env.BRIDGE_PORT) || 4444,
  authToken: process.env.BRIDGE_AUTH_TOKEN,
  totalShards: process.env.TOTAL_SHARDS || "auto",
  totalMachines: Number(process.env.TOTAL_MACHINES) || 1,
  shardsPerCluster: Number(process.env.SHARDS_PER_CLUSTER) || 2,
  token: process.env.DISCORD_TOKEN,
});

server.on("debug", (msg) => log(`[Bridge] ${msg}`, "LOG", "gray"));
server.on("error", (err) => log(`❌ [Bridge] ${err.message}`, "error", "red"));

server.on("connect", (client) =>
  log(`🔌 Machine connectée (agent: ${client.agent ?? "?"})`, "BRIDGE", "cyan"),
);
server.on("disconnect", (client, reason) =>
  log(`🔌 Machine déconnectée (${reason})`, "BRIDGE", "yellow"),
);

server.start();

server.on("ready", (url) =>
  log(`✅ Bridge prêt sur ${url}`, "BRIDGE", "green"),
);
