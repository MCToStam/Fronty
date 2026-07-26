let tokenCache = {
  jwt: null,
  expiresAt: 0,
};

const apiCache = new Map();

const CACHE_DURATION = 60 * 1000;

async function getToken() {
  const now = Date.now();

  if (tokenCache.jwt && tokenCache.expiresAt > now + 30000) {
    return tokenCache.jwt;
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

  if (!data.jwt || !data.expiresIn) {
    throw new Error("Réponse auth invalide : JWT manquant");
  }

  tokenCache.jwt = data.jwt;
  tokenCache.expiresAt = now + data.expiresIn * 1000;

  return tokenCache.jwt;
}

async function OpenFrontAPI(url, options = {}) {
  const cacheKey = `${options.method || "GET"}:${url}`;

  const cached = apiCache.get(cacheKey);

  if (cached && cached.expiresAt > Date.now()) {
    return cached.data;
  }

  const jwt = await getToken();

  let response = await fetch(url, {
    ...options,

    headers: {
      ...(options.headers || {}),

      Authorization: `Bearer ${jwt}`,
      "Content-Type": "application/json",
    },
  });

  if (response.status === 401) {
    tokenCache.jwt = null;
    tokenCache.expiresAt = 0;

    const newToken = await getToken();

    response = await fetch(url, {
      ...options,

      headers: {
        ...(options.headers || {}),

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
