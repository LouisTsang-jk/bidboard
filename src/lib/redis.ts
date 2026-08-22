import Redis from "ioredis";

declare global {
  var __bidboardRedis: Redis | undefined;
}

export function getRedis(): Redis | null {
  const url = process.env.REDIS_URL;
  if (!url) return null;

  if (!globalThis.__bidboardRedis) {
    const client = new Redis(url, {
      connectTimeout: 1_500,
      enableOfflineQueue: false,
      lazyConnect: true,
      maxRetriesPerRequest: 1,
      retryStrategy: (attempt) => Math.min(attempt * 100, 1_000),
    });
    client.on("error", () => {
      // Individual callers provide a database or stale-cache fallback.
    });
    globalThis.__bidboardRedis = client;
  }

  return globalThis.__bidboardRedis;
}
