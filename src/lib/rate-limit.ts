import "server-only";

import { getRedis } from "./redis";

export async function takeRateLimit(
  key: string,
  limit: number,
  windowSeconds: number,
): Promise<{ allowed: boolean; remaining: number }> {
  const redis = getRedis();
  if (!redis) return { allowed: true, remaining: limit };

  try {
    const bucket = `rate:${key}:${Math.floor(Date.now() / (windowSeconds * 1000))}`;
    const pipeline = redis.multi();
    pipeline.incr(bucket);
    pipeline.expire(bucket, windowSeconds + 2);
    const results = await pipeline.exec();
    const count = Number(results?.[0]?.[1] ?? 1);
    return { allowed: count <= limit, remaining: Math.max(limit - count, 0) };
  } catch {
    return { allowed: true, remaining: limit };
  }
}
