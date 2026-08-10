const cheerio = require("cheerio");
const MapModel = require("../util/database/models/Map");
const log = require("../util/module/log");

const BASE_URL = "https://openfront.io";
const CDN_URL = "https://cdn.ofedge.io/game_assets";

const LOCALE_MAP = {
  id: "id",
  bg: "bg",
  cs: "cs",
  da: "da",
  de: "de",
  el: "el",
  fi: "fi",
  fr: "fr",
  hi: "hi",
  hu: "hu",
  it: "it",
  ja: "ja",
  ko: "ko",
  nl: "nl",
  pl: "pl",
  "pt-BR": "pt-BR",
  ru: "ru",
  "sv-SE": "sv-SE",
  tr: "tr",
  uk: "uk",
  "zh-CN": "zh-CN",

  en: "en-GB",
  es: "es-ES",

  ar: null,
  bn: null,
  ca: null,
  "de-CH": null,
  eo: null,
  et: null,
  fa: null,
  gl: null,
  he: null,
  mk: null,
  "pt-PT": null,
  sh: null,
  sk: null,
  sl: null,
  tp: null,
};

const USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120 Safari/537.36";

const jsonCache = new Map();

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchJson(url) {
  if (jsonCache.has(url)) {
    return jsonCache.get(url);
  }

  let attempts = 0;

  while (attempts < 5) {
    const res = await fetch(url, {
      headers: {
        "User-Agent": USER_AGENT,
        Accept: "application/json",
      },
    });

    if (res.status === 429) {
      const retry = Number(res.headers.get("retry-after")) || 5;

      log(`Rate limit ${url}, retry dans ${retry}s`, "TASK", "yellow");

      await sleep(retry * 1000);

      attempts++;
      continue;
    }

    if (!res.ok) throw new Error(`${url}: ${res.status}`);

    const json = await res.json();

    jsonCache.set(url, json);

    await sleep(300);

    return json;
  }

  throw new Error(`Too many retries: ${url}`);
}

async function fetchText(url) {
  const res = await fetch(url, {
    headers: {
      "User-Agent": USER_AGENT,
      Accept: "text/html,application/xhtml+xml",
    },
  });

  if (!res.ok) throw new Error(`${url}: ${res.status}`);

  return res.text();
}

async function getBootstrapConfig() {
  const html = await fetchText(BASE_URL);

  const $ = cheerio.load(html);

  let bootstrap = null;

  $("script").each((_, el) => {
    const content = $(el).html();

    if (!content?.includes("window.BOOTSTRAP_CONFIG")) {
      return;
    }

    const match = content.match(
      /window\.BOOTSTRAP_CONFIG\s*=\s*(\{[\s\S]*?\});/,
    );

    if (match) bootstrap = Function(`"use strict"; return (${match[1]})`)();
  });

  if (!bootstrap) throw new Error("BOOTSTRAP_CONFIG introuvable");

  return bootstrap;
}

async function loadTranslations(assetManifest) {
  const translations = {};
  const categoryTranslations = {};

  const files = Object.entries(assetManifest).filter(([key]) =>
    key.startsWith("lang/"),
  );

  for (const [key, asset] of files) {
    const openFrontLocale = key.replace("lang/", "").replace(".json", "");
    const language = LOCALE_MAP[openFrontLocale];

    if (!language) continue;

    const json = await fetchJson(CDN_URL + asset);

    if (json.map) {
      for (let [translationKey, value] of Object.entries(json.map)) {
        translationKey = translationKey.replace("map.", "");

        translations[translationKey] ??= {};
        translations[translationKey][language] = value;
      }
    }

    if (json.map_categories) {
      for (const [category, value] of Object.entries(json.map_categories)) {
        categoryTranslations[category] ??= {};
        categoryTranslations[category][language] = value;
      }
    }
  }

  return {
    translations,
    categoryTranslations,
  };
}

async function buildDocuments(
  assetManifest,
  translations,
  categoryTranslations,
) {
  const manifests = Object.entries(assetManifest).filter(
    ([key]) => key.startsWith("maps/") && key.endsWith("manifest.json"),
  );

  const documents = [];

  for (const [key, asset] of manifests) {
    const folder = key.split("/")[1];

    const manifest = await fetchJson(CDN_URL + asset);

    const translationKey = manifest.translation_key?.replace("map.", "");

    const createMapSize = (prefix) => {
      const data = manifest[prefix];
      if (!data) return null;

      return {
        url: CDN_URL + assetManifest[`maps/${folder}/${prefix}.bin`],
        width: data.width,
        height: data.height,
        num_land_tiles: data.num_land_tiles,
      };
    };

    documents.push({
      id: manifest.id,
      translations: translations[translationKey] ?? {
        "en-GB": manifest.name,
      },
      thumbnail: CDN_URL + assetManifest[`maps/${folder}/thumbnail.webp`],
      categories: (manifest.categories ?? []).reduce((result, category) => {
        const translated = categoryTranslations[category];

        if (!translated) return result;

        for (const [lang, label] of Object.entries(translated)) {
          result[lang] ??= [];
          result[lang].push(label);
        }

        return result;
      }, {}),
      multiplayer_frequency: manifest.multiplayer_frequency ?? null,
      map: createMapSize("map"),
      map4x: createMapSize("map4x"),
      map16x: createMapSize("map16x"),
      nations: manifest.nations ?? [],
    });

    await sleep(300);
  }

  return documents;
}

async function updateMaps() {
  const bootstrap = await getBootstrapConfig();

  const { translations, categoryTranslations } = await loadTranslations(
    bootstrap.assetManifest,
  );

  const documents = await buildDocuments(
    bootstrap.assetManifest,
    translations,
    categoryTranslations,
  );

  await MapModel.bulkWrite(
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

  await MapModel.deleteMany({
    id: {
      $nin: documents.map((d) => d.id),
    },
  });

  log(
    `Map synchronization complete (${documents.length} maps)`,
    "TASK",
    "magentaBright",
  );
}

module.exports = updateMaps;
