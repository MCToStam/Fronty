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

async function getToken({ withRefreshToken = false } = {}) {
  const cache = withRefreshToken ? tokenCache.refresh : tokenCache.default;

  const now = Date.now();

  if (cache.jwt && cache.expiresAt > now + 30000) {
    return cache.jwt;
  }

  const response = await fetch("https://api.openfront.io/auth/refresh", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(withRefreshToken
        ? {
            Cookie: `refreshToken=${process.env.OPENFRONT_REFRESH_TOKEN}`,
          }
        : {}),
    },
  });

  if (!response.ok) {
    throw new Error(`Erreur authentification OpenFront : ${response.status}`);
  }

  const data = await response.json();

  if (!data.jwt || !data.expiresIn) {
    throw new Error("Réponse auth invalide : JWT manquant");
  }

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
