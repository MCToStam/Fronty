const fs = require("fs");
const path = require("path");
const cloudscraper = require("cloudscraper");
const request = require("request");

const apiCache = new Map();

const CACHE_DURATION = 60 * 1000;

const tokenCache = {
  default: {
    jwt: null,
    expiresAt: 0,
  },
  refresh: {
    jwt: null,
    expiresAt: 0,
  },
};

const COOKIE_FILE = path.join(__dirname, "..", "openfront-cookies.json");

let refreshPromise = null;

const scraper = cloudscraper.defaults({
  requester: request,
});

function scraperRequest(options) {
  return new Promise((resolve, reject) => {
    scraper(options, (error, response, body) => {
      if (error) {
        reject(error);
        return;
      }

      if (!response) {
        reject(new Error("Cloudscraper n'a retourné aucune réponse HTTP"));
        return;
      }

      response.body = body;

      resolve(response);
    });
  });
}

function loadCookies() {
  try {
    if (!fs.existsSync(COOKIE_FILE)) {
      return {
        refreshToken: null,
      };
    }

    const data = JSON.parse(fs.readFileSync(COOKIE_FILE, "utf8"));

    return {
      refreshToken:
        typeof data.refreshToken === "string" ? data.refreshToken : null,
    };
  } catch (error) {
    throw new Error(`Impossible de lire ${COOKIE_FILE}: ${error.message}`);
  }
}

function saveCookies(cookies) {
  const directory = path.dirname(COOKIE_FILE);

  fs.mkdirSync(directory, {
    recursive: true,
  });

  const tempFile = `${COOKIE_FILE}.tmp`;

  fs.writeFileSync(tempFile, JSON.stringify(cookies, null, 2), {
    encoding: "utf8",
    mode: 0o600,
  });

  fs.renameSync(tempFile, COOKIE_FILE);

  fs.chmodSync(COOKIE_FILE, 0o600);
}

let cookies = loadCookies();

function getCookieHeader() {
  if (!cookies.refreshToken) {
    return "";
  }

  return `refreshToken=${cookies.refreshToken}`;
}

function getSetCookies(response) {
  const setCookie = response.headers?.["set-cookie"];

  if (!setCookie) {
    return [];
  }

  return Array.isArray(setCookie) ? setCookie : [setCookie];
}

function updateCookiesFromResponse(response) {
  const setCookies = getSetCookies(response);

  for (const setCookie of setCookies) {
    const firstPart = setCookie.split(";")[0];

    const separatorIndex = firstPart.indexOf("=");

    if (separatorIndex === -1) {
      continue;
    }

    const name = firstPart.slice(0, separatorIndex).trim();

    const value = firstPart.slice(separatorIndex + 1).trim();

    if (name !== "refreshToken") {
      continue;
    }

    if (!value) {
      cookies.refreshToken = null;
      saveCookies(cookies);
      continue;
    }

    if (cookies.refreshToken !== value) {
      cookies.refreshToken = value;
      saveCookies(cookies);
    }
  }
}

function parseJson(response) {
  if (!response.body) {
    throw new Error("Réponse vide");
  }

  try {
    return JSON.parse(response.body);
  } catch (error) {
    throw new Error(
      `Réponse JSON invalide : ${error.message}\n\nBody:\n${response.body}`,
    );
  }
}

async function refreshToken() {
  if (refreshPromise) {
    return refreshPromise;
  }

  refreshPromise = (async () => {
    if (!cookies.refreshToken) {
      throw new Error(`Aucun refreshToken trouvé dans ${COOKIE_FILE}`);
    }

    const response = await scraperRequest({
      uri: "https://api.openfront.io/auth/refresh",
      method: "POST",

      headers: {
        "Content-Type": "application/json",
        Cookie: getCookieHeader(),
        Accept: "application/json",
      },

      gzip: true,
    });

    updateCookiesFromResponse(response);

    if (response.statusCode < 200 || response.statusCode >= 300) {
      throw new Error(
        `Erreur authentification OpenFront : ${response.statusCode}\n${response.body || ""}`,
      );
    }

    const data = parseJson(response);

    return {
      jwt: data.jwt,
      expiresAt: Date.now() + data.expiresIn * 1000,
    };
  })();

  try {
    return await refreshPromise;
  } finally {
    refreshPromise = null;
  }
}

async function getToken({ withRefreshToken = false } = {}) {
  const cache = withRefreshToken ? tokenCache.refresh : tokenCache.default;

  const now = Date.now();

  if (cache.jwt && cache.expiresAt > now + 30000) {
    return cache.jwt;
  }

  if (withRefreshToken) {
    const result = await refreshToken();

    cache.jwt = result.jwt;
    cache.expiresAt = result.expiresAt;

    return cache.jwt;
  }

  const response = await scraperRequest({
    uri: "https://api.openfront.io/auth/refresh",
    method: "POST",

    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },

    gzip: true,
  });

  if (response.statusCode < 200 || response.statusCode >= 300) {
    throw new Error(
      `Erreur authentification OpenFront : ${response.statusCode}\n${response.body || ""}`,
    );
  }

  const data = parseJson(response);

  cache.jwt = data.jwt;
  cache.expiresAt = Date.now() + data.expiresIn * 1000;

  return cache.jwt;
}

async function OpenFrontAPI(url, options = {}) {
  const cacheKey = `${options.method || "GET"}:${url}`;

  const cached = apiCache.get(cacheKey);

  if (cached && cached.expiresAt > Date.now()) {
    return cached.data;
  }

  const { withRefreshToken = false, ...requestOptions } = options;

  const jwt = await getToken({
    withRefreshToken,
  });

  async function makeRequest(token) {
    const method = requestOptions.method || "GET";

    const headers = {
      ...(requestOptions.headers || {}),
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      Accept: "application/json",
    };

    const scraperOptions = {
      uri: url,
      method,
      headers,
      gzip: true,
    };

    if (requestOptions.body !== undefined) {
      scraperOptions.body = requestOptions.body;
    }

    if (requestOptions.qs !== undefined) {
      scraperOptions.qs = requestOptions.qs;
    }

    return scraperRequest(scraperOptions);
  }

  let response = await makeRequest(jwt);

  if (response.statusCode === 401 || response.statusCode === 403) {
    const cache = withRefreshToken ? tokenCache.refresh : tokenCache.default;

    cache.jwt = null;
    cache.expiresAt = 0;

    const newToken = await getToken({
      withRefreshToken,
    });

    response = await makeRequest(newToken);
  }

  if (response.statusCode < 200 || response.statusCode >= 300) {
    throw new Error(
      `Erreur API OpenFront (${response.statusCode})\n${response.body || ""}`,
    );
  }

  const data = parseJson(response);

  apiCache.set(cacheKey, {
    data,
    expiresAt: Date.now() + CACHE_DURATION,
  });

  return data;
}

module.exports = {
  OpenFrontAPI,
};
