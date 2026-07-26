const fs = require("fs-extra");
const path = require("path");
const os = require("os");
const simpleGit = require("simple-git");
const Map = require("./database/models/Map");
const log = require("./module/log");

const REPOSITORY = "https://github.com/openfrontio/OpenFrontIO.git";

const RAW_BASE =
  "https://raw.githubusercontent.com/openfrontio/OpenFrontIO/main/resources";

async function loadTranslations(langFolder) {
  const translations = {};

  const files = await fs.readdir(langFolder);

  for (const file of files) {
    if (!file.endsWith(".json")) continue;

    const language = file.replace(".json", "");

    const json = await fs.readJson(path.join(langFolder, file));

    if (!json.map) continue;

    for (let [key, value] of Object.entries(json.map)) {
      if (key === "en") key = "en-GB";

      if (!translations[key]) {
        translations[key] = {};
      }

      translations[key][language] = value;
    }
  }

  return translations;
}

async function buildDocuments(mapsFolder, translations) {
  const folders = await fs.readdir(mapsFolder);

  const documents = [];

  for (const folder of folders) {
    const manifestPath = path.join(mapsFolder, folder, "manifest.json");

    if (!(await fs.pathExists(manifestPath))) {
      continue;
    }

    const manifest = await fs.readJson(manifestPath);

    const translationKey = manifest.translation_key.replace("map.", "");

    documents.push({
      id: manifest.id,

      translations: translations[translationKey] || {
        en: manifest.name,
      },

      thumbnail: `${RAW_BASE}/maps/${folder}/thumbnail.webp`,

      categories: manifest.categories,

      featured_rank: manifest.featured_rank,

      multiplayer_frequency: manifest.multiplayer_frequency,

      map: manifest.map,

      map4x: manifest.map4x,

      map16x: manifest.map16x,

      nations: manifest.nations,

      updatedAt: new Date(),
    });
  }

  return documents;
}

async function updateMaps() {
  const tempFolder = await fs.mkdtemp(
    path.join(os.tmpdir(), "openfront-maps-"),
  );

  try {
    await simpleGit().clone(REPOSITORY, tempFolder, ["--depth", "1"]);

    const translations = await loadTranslations(
      path.join(tempFolder, "resources", "lang"),
    );

    const documents = await buildDocuments(
      path.join(tempFolder, "resources", "maps"),
      translations,
    );

    await Map.bulkWrite(
      documents.map((doc) => ({
        updateOne: {
          filter: {
            id: doc.id,
          },
          update: {
            $set: doc,
          },
          upsert: true,
        },
      })),
    );

    const ids = documents.map((d) => d.id);

    const result = await Map.deleteMany({
      id: {
        $nin: ids,
      },
    });

    log("Map synchronization complete", "TASK", "magentaBright");
  } finally {
    await fs.remove(tempFolder);
  }
}

module.exports = updateMaps;
