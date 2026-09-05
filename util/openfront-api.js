const fs = require("fs");
const path = require("path");

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
  if (!cookies.refreshToken) return "";

  return `refreshToken=${cookies.refreshToken}`;
}

function getSetCookies(response) {
  if (typeof response.headers.getSetCookie === "function")
    return response.headers.getSetCookie();

  const setCookie = response.headers.get("set-cookie");

  if (!setCookie) return [];

  return [setCookie];
}

function updateCookiesFromResponse(response) {
  const setCookies = getSetCookies(response);

  for (const setCookie of setCookies) {
    const firstPart = setCookie.split(";")[0];

    const separatorIndex = firstPart.indexOf("=");

    if (separatorIndex === -1) continue;

    const name = firstPart.slice(0, separatorIndex).trim();

    const value = firstPart.slice(separatorIndex + 1).trim();

    if (name !== "refreshToken") continue;

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

async function refreshToken() {
  if (refreshPromise) return refreshPromise;

  refreshPromise = (async () => {
    if (!cookies.refreshToken) {
      throw new Error(`Aucun refreshToken trouvé dans ${COOKIE_FILE}`);
    }

    const response = await fetch("https://api.openfront.io/auth/refresh", {
      method: "POST",

      headers: {
        "Content-Type": "application/json",

        Cookie: getCookieHeader(),
      },
    });

    updateCookiesFromResponse(response);

    if (!response.ok) {
      throw new Error(`Erreur authentification OpenFront : ${response.status}`);
    }

    const data = await response.json();

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

  const response = await fetch("https://api.openfront.io/auth/refresh", {
    method: "POST",

    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(`Erreur authentification OpenFront : ${response.status}`);
  }

  const data = await response.json();

  cache.jwt = data.jwt;
  cache.expiresAt = now + data.expiresIn * 1000;

  return cache.jwt;
}

async function OpenFrontAPI(url, options = {}) {
  const cacheKey = `${options.method || "GET"}:${url}`;

  const cached = apiCache.get(cacheKey);

  if (cached && cached.expiresAt > Date.now()) {
    return cached.data;
  }

  const { withRefreshToken = false, ...fetchOptions } = options;

  const jwt = await getToken({ withRefreshToken });

  let response = await fetch(url, {
    ...fetchOptions,
    headers: {
      ...(fetchOptions.headers || {}),
      Authorization: `Bearer ${jwt}`,
      "Content-Type": "application/json",
    },
  });

  if (response.status === 401 || response.status === 403) {
    const cache = withRefreshToken ? tokenCache.refresh : tokenCache.default;

    cache.jwt = null;
    cache.expiresAt = 0;

    const newToken = await getToken({ withRefreshToken });

    response = await fetch(url, {
      ...fetchOptions,

      headers: {
        ...(fetchOptions.headers || {}),
        Authorization: `Bearer ${newToken}`,
        "Content-Type": "application/json",
      },
    });
  }

  if (!response.ok) {
    throw new Error(`Erreur API OpenFront (${response.status})`);
  }

  const data = await response.json();

  apiCache.set(cacheKey, {
    data,
    expiresAt: Date.now() + CACHE_DURATION,
  });

  return data;
}

module.exports = {
  OpenFrontAPI,
};
