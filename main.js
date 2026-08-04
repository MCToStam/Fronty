if (Number(process.version.slice(1).split(".")[0]) < 19)
  throw new Error("Node 19.x is required. Update Node on your system.");
require("dotenv").config({ quiet: true });

const { Client, Collection, Partials, IntentsBitField } = require("discord.js");
const { readdirSync } = require("fs");
const pathModule = require("path");
const log = require("./util/module/log");
const { connectMongo } = require("./util/database/index");

process.on("unhandledRejection", (reason, p) => {
  log(`[antiCrash] Unhandled Rejection: ${reason}`, "error", "red");
  console.log(reason, p);
});
process.on("uncaughtException", (err) => {
  log(`[antiCrash] Uncaught Exception: ${err.stack}`, "error", "red");
});
process.on("uncaughtExceptionMonitor", (err, origin) => {
  log(`[antiCrash] Uncaught Exception (MONITOR): ${err.stack}`, "error", "red");
  console.log(origin);
});

const client = new Client({
  intents: new IntentsBitField([]),
  partials: [Partials.User, Partials.Channel, Partials.GuildMember],
});

client.botLaunch = Date.now();
client.cooldowns = new Collection();

client.container = {
  slashCmds: new Collection(),
  userCmds: new Collection(),
  msgCmds: new Collection(),
  buttons: new Collection(),
  stringSelects: new Collection(),
  channelSelects: new Collection(),
  roleSelects: new Collection(),
  modals: new Collection(),
};

const shardTag = () =>
  `Shard(s) ${client.shard ? client.shard.ids.join(",") : "0"}`;

const init = async () => {
  async function load(type, dirPath) {
    const getFilesRecursively = (dir) =>
      readdirSync(dir, { withFileTypes: true }).flatMap((entry) =>
        entry.isDirectory()
          ? getFilesRecursively(pathModule.join(dir, entry.name))
          : entry.name.endsWith(".js")
            ? [pathModule.join(dir, entry.name)]
            : [],
      );

    const files = getFilesRecursively(dirPath);

    for (const file of files) {
      const fullPath = pathModule.resolve(file);
      delete require.cache[require.resolve(fullPath)];
      const command = require(fullPath);
      const commandName = pathModule.basename(file, ".js");

      client.container[type].set(commandName, command);
    }
  }

  await connectMongo();
  log(`✅ [${shardTag()}] Connexion MongoDB établie`, "READY", "gray");

  const loaders = [
    ["slashCmds", "./src/commands/slash"],
    ["userCmds", "./src/commands/user"],
    ["msgCmds", "./src/commands/message"],
    ["buttons", "./src/events/button"],
    ["stringSelects", "./src/events/select/string"],
    ["channelSelects", "./src/events/select/channel"],
    ["roleSelects", "./src/events/select/role"],
    ["modals", "./src/events/modal"],
  ];

  await Promise.all(loaders.map(([t, p]) => load(t, p)));

  const eventFiles = readdirSync("./src/events/interaction").filter((file) =>
    file.endsWith(".js"),
  );

  for (const file of eventFiles) {
    const eventName = file.split(".")[0];
    log(`✅ [${shardTag()}] Loading of event ${eventName}`, "LOG", "gray");
    const event = require(`./src/events/interaction/${file}`);
    client.on(eventName, (...args) => event(client, ...args));
  }

  await client.login(process.env.DISCORD_TOKEN); /*.then(async () => {
    const guild = client.guilds.cache.get("743741992194015314");
    const guildCmds = guild.commands;
    const cmd = client.container.slashCmds;
    const slashCmd = cmd.filter((c)=> c.data.name === "cmd")
    await guildCmds
      .set(slashCmd.map((c) => c.data))
      .catch((e) => console.log(e));
  });*/
};

init().catch((err) => {
  log(
    `❌ [${shardTag()}] Erreur fatale à l'initialisation: ${err.stack}`,
    "error",
    "red",
  );
  process.exit(1);
});

module.exports = { client };
