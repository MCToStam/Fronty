const fs = require("fs");
const path = require("path");

const Config = require("../util/database/models/Config");

const LOCALES_DIR = path.join(__dirname, "../locales");
const DEFAULT_LANG = "en-GB";

const locales = new Map();

function loadLocales() {
  for (const file of fs.readdirSync(LOCALES_DIR)) {
    if (!file.endsWith(".json")) continue;
    const lang = path.basename(file, ".json");
    const content = JSON.parse(
      fs.readFileSync(path.join(LOCALES_DIR, file), "utf8"),
    );
    locales.set(lang, content);
  }
}

loadLocales();

function getLocalization(keyPath) {
  const result = {};
  const keys = keyPath.split(".");

  for (const [lang, data] of locales) {
    let value = data;

    for (const key of keys) {
      value = value?.[key];
    }

    if (typeof value === "string" && value.length > 0) {
      result[lang] = value;
    }
  }

  return result;
}

const guildInfoCache = new Map();

async function getGuildInfo(clientLanguage, guild) {
  const guildId = typeof guild === "string" ? guild : guild?.id;
  if (!guildId) {
    return {
      language: DEFAULT_LANG,
    };
  }

  if (guildInfoCache.has(guildId)) {
    return guildInfoCache.get(guildId);
  }

  let config = null;

  try {
    config = await Config.findOne({ guildId }).lean();
  } catch (err) {
    console.error("[guildInfo] Erreur lecture Config:", err);
  }

  const info = {
    language: config?.language || null,
  };

  if (!info.language && (clientLanguage || guild?.preferredLocale)) {
    const base = clientLanguage || guild.preferredLocale.split("-")[0];
    if (locales.has(base)) info.language = base;
  }

  if (!info.language || !locales.has(info.language)) {
    info.language = DEFAULT_LANG;
  }

  guildInfoCache.set(guildId, info);
  return info;
}

async function setGuildInfo(guildId, data) {
  const update = {
    $set: {},
  };

  if (data.language !== undefined) {
    update.$set.language = data.language;
  }

  await Config.findOneAndUpdate({ guildId }, update, { upsert: true });

  const existing = guildInfoCache.get(guildId) || {};
  guildInfoCache.set(guildId, {
    ...existing,
    ...data,
  });
}

function invalidateGuildCache(guildId) {
  guildInfoCache.delete(guildId);
}

function resolveKey(obj, key) {
  return key
    .split(".")
    .reduce((acc, part) => (acc != null ? acc[part] : undefined), obj);
}

function interpolate(str, params) {
  if (!params) return str;
  return str.replace(/{{\s*(\w+)\s*}}/g, (_, name) =>
    params[name] !== undefined ? params[name] : `{{${name}}}`,
  );
}

function translate(lang, key, params) {
  const table = locales.get(lang) || locales.get(DEFAULT_LANG);
  let value = resolveKey(table, key);

  if (value === undefined && lang !== DEFAULT_LANG) {
    value = resolveKey(locales.get(DEFAULT_LANG), key);
  }

  if (value === undefined) return key;

  return typeof value === "string" ? interpolate(value, params) : value;
}

function availableLanguages() {
  return [...locales.entries()].map(([code, locale]) => ({
    code,
    label: locale.type?.label || code,
    flag: locale.type?.flag || "",
  }));
}

module.exports = {
  getLocalization,
  getGuildInfo,
  setGuildInfo,
  invalidateGuildCache,
  translate,
  availableLanguages,
};
