import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import path from 'path';

const CACHE_DIR = process.env.CACHE_DIR ?? path.join(process.cwd(), '.cache');

interface CacheEntry<T> {
  data: T;
  expiresAt: number | null;
}

function cacheFilePath(key: string): string {
  const safe = key.replace(/[^a-zA-Z0-9_-]/g, '_');
  return path.join(CACHE_DIR, `${safe}.json`);
}

export async function getCache<T>(key: string): Promise<T | null> {
  const file = cacheFilePath(key);
  if (!existsSync(file)) return null;
  try {
    const entry: CacheEntry<T> = JSON.parse(readFileSync(file, 'utf-8'));
    if (entry.expiresAt !== null && Date.now() > entry.expiresAt) return null;
    return entry.data;
  } catch {
    return null;
  }
}

export async function setCache<T>(key: string, data: T, ttlSeconds?: number): Promise<void> {
  mkdirSync(CACHE_DIR, { recursive: true });
  const entry: CacheEntry<T> = {
    data,
    expiresAt: ttlSeconds !== undefined ? Date.now() + ttlSeconds * 1000 : null,
  };
  writeFileSync(cacheFilePath(key), JSON.stringify(entry));
}
