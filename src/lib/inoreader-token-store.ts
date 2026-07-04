/**
 * Durable key/value store for the two Inoreader OAuth token cache entries
 * (access token, rotated refresh token) — SERVER-SIDE ONLY.
 *
 * The file cache in src/lib/cache.ts lives on Vercel's ephemeral filesystem,
 * which is wiped on cold start. That's fine for rebuildable data (news feeds,
 * scoreboards) but not for the Inoreader refresh token: Inoreader rotates it
 * on every refresh, so losing the rotated value strands us on a dead token
 * and getAccessToken() starts failing with invalid_grant.
 *
 * When Upstash Redis env vars are present, use it (durable across
 * invocations). Otherwise fall back to the file cache — keeps local dev
 * working without any extra setup.
 */
import { Redis } from '@upstash/redis';
import { getCache, setCache } from '@/lib/cache';

let redis: Redis | null = null;
let redisChecked = false;

function getRedis(): Redis | null {
  if (redisChecked) return redis;
  redisChecked = true;
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (url && token) redis = new Redis({ url, token });
  return redis;
}

export async function getToken<T>(key: string): Promise<T | null> {
  const client = getRedis();
  if (client) return (await client.get<T>(key)) ?? null;
  return getCache<T>(key);
}

export async function setToken<T>(key: string, value: T, ttlSeconds?: number): Promise<void> {
  const client = getRedis();
  if (client) {
    if (ttlSeconds !== undefined) await client.set(key, value, { ex: ttlSeconds });
    else await client.set(key, value);
    return;
  }
  await setCache(key, value, ttlSeconds);
}
