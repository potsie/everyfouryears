import { getCache, setCache } from '@/lib/cache';
import { todayESPN } from '@/lib/dates';

export function isToday(yyyymmdd: string): boolean {
  return yyyymmdd === todayESPN();
}

export async function espnFetch<T>(url: string, cacheKey: string, ttl: number | undefined): Promise<T> {
  const cached = await getCache<T>(cacheKey);
  if (cached) return cached;

  const res = await fetch(url);
  if (!res.ok) throw new Error(`ESPN fetch failed: ${res.status} ${url}`);
  const data: T = await res.json();

  await setCache(cacheKey, data, ttl);
  return data;
}
