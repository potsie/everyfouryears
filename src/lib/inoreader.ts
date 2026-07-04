/**
 * Inoreader Stream Contents client — SERVER-SIDE ONLY.
 *
 * Pulls the curated "World Cup" folder (or a saved-search stream) from a paid
 * Inoreader account and normalizes each item into the source-agnostic NewsItem
 * shape used across the news layer.
 *
 * Auth: OAuth2. We hold a long-lived refresh token (obtained once via
 * scripts/get-inoreader-token.mjs) plus the app's client id/secret, and
 * exchange them for short-lived access tokens at runtime. Access tokens are
 * cached with their expiry; the API is called with `Authorization: Bearer`.
 *
 * Credentials live in environment variables and are never sent to the browser.
 * The hard guard below throws if this module is ever imported in a client
 * bundle, so a stray import can't leak the client secret or tokens.
 */
import { getCache, setCache } from '@/lib/cache';
import { getToken, setToken } from '@/lib/inoreader-token-store';
import type { NewsItem } from '@/lib/news';

if (typeof window !== 'undefined') {
  throw new Error('src/lib/inoreader.ts is server-only and must not be imported in the browser.');
}

const API_BASE = 'https://www.inoreader.com/reader/api/0';
const TOKEN_URL = 'https://www.inoreader.com/oauth2/token';
const DEFAULT_STREAM = 'user/-/label/World Cup';
const DEFAULT_ITEM_COUNT = 50;
/** Match the ESPN news cadence: 10-minute cache. */
const NEWS_TTL = 600;

const ACCESS_TOKEN_KEY = 'inoreader-access-token';
const REFRESH_TOKEN_KEY = 'inoreader-refresh-token';

export interface InoreaderConfig {
  clientId: string;
  clientSecret: string;
  refreshToken: string;
  stream: string;
  itemCount: number;
}

/** Read + validate Inoreader env. Returns null when not configured (caller skips Inoreader). */
export function getInoreaderConfig(): InoreaderConfig | null {
  const clientId = process.env.INOREADER_CLIENT_ID;
  const clientSecret = process.env.INOREADER_CLIENT_SECRET;
  const refreshToken = process.env.INOREADER_REFRESH_TOKEN;
  if (!clientId || !clientSecret || !refreshToken) return null;
  return {
    clientId,
    clientSecret,
    refreshToken,
    stream: process.env.INOREADER_STREAM || DEFAULT_STREAM,
    itemCount: Number(process.env.INOREADER_ITEM_COUNT) || DEFAULT_ITEM_COUNT,
  };
}

/* ------------------------------- OAuth tokens ----------------------------- */

interface TokenResponse {
  access_token?: string;
  refresh_token?: string;
  expires_in?: number;
  error?: string;
  error_description?: string;
}

/**
 * Return a valid access token, refreshing via the OAuth refresh-token grant
 * when the cached one is missing/expired. The current refresh token is read
 * from cache first (in case Inoreader rotated it on a prior refresh), falling
 * back to the env seed. A rotated refresh token is persisted to cache.
 *
 * @param force - skip the cached access token and force a refresh (used to
 *                recover from a 401 on a token that looked valid).
 */
async function getAccessToken(cfg: InoreaderConfig, force = false): Promise<string> {
  if (!force) {
    const cached = await getToken<{ token: string }>(ACCESS_TOKEN_KEY);
    if (cached?.token) return cached.token;
  }

  const stored = await getToken<{ refresh: string }>(REFRESH_TOKEN_KEY);
  const refreshToken = stored?.refresh || cfg.refreshToken;

  const res = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: cfg.clientId,
      client_secret: cfg.clientSecret,
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
    }),
  });

  const data: TokenResponse = await res.json().catch(() => ({}));
  if (!res.ok || !data.access_token) {
    throw new Error(
      `Inoreader token refresh failed: ${res.status} ${data.error ?? ''} ${data.error_description ?? ''}`.trim(),
    );
  }

  // Cache the access token slightly ahead of its real expiry to avoid races.
  const ttl = Math.max(60, (data.expires_in ?? 3600) - 60);
  await setToken(ACCESS_TOKEN_KEY, { token: data.access_token }, ttl);

  // Persist a rotated refresh token (no TTL) so future refreshes keep working.
  if (data.refresh_token && data.refresh_token !== refreshToken) {
    await setToken(REFRESH_TOKEN_KEY, { refresh: data.refresh_token });
  }

  return data.access_token;
}

/* ----------------------------- raw API shapes ----------------------------- */

interface InoreaderLink { href: string }
interface InoreaderItemRaw {
  id?: string;
  title?: string;
  published?: number; // Unix SECONDS, not ms
  author?: string;
  summary?: { content?: string };
  canonical?: InoreaderLink[];
  alternate?: InoreaderLink[];
  enclosure?: InoreaderLink[];
  categories?: string[];
  origin?: { streamId?: string; title?: string };
}
interface InoreaderStreamResponse {
  items?: InoreaderItemRaw[];
}

/* ------------------------------ normalization ----------------------------- */

const ENTITIES: Record<string, string> = {
  '&amp;': '&', '&lt;': '<', '&gt;': '>', '&quot;': '"', '&#39;': "'", '&apos;': "'", '&nbsp;': ' ',
};

/**
 * Decode HTML entities (named, decimal, hex). Unknown named entities are left
 * intact. Safe for both display text and URLs — Inoreader HTML-encodes the
 * ampersands in feed/enclosure hrefs (`&amp;`), which would otherwise corrupt
 * query strings (e.g. Guardian's signed image params → 403).
 */
function decodeEntities(s: string): string {
  return s
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)))
    .replace(/&#x([0-9a-f]+);/gi, (_, code) => String.fromCharCode(parseInt(code, 16)))
    .replace(/&[a-z]+;/gi, (m) => ENTITIES[m.toLowerCase()] ?? m);
}

/** Strip HTML tags, decode entities, collapse whitespace, truncate. */
export function htmlToText(html: string, maxLen = 280): string {
  if (!html) return '';
  let text = decodeEntities(
    html
      .replace(/<\s*(script|style)[^>]*>[\s\S]*?<\/\s*\1\s*>/gi, '')
      .replace(/<[^>]+>/g, ' '),
  )
    .replace(/\s+/g, ' ')
    .trim();
  if (text.length > maxLen) {
    text = text.slice(0, maxLen).replace(/\s+\S*$/, '').trimEnd() + '…';
  }
  return text;
}

/**
 * Clean outlet name for the source badge. Inoreader's `origin.title` is the
 * feed's verbose title ("World Cup 2026: Latest News … | BBC"), and some feeds
 * (NBC) don't name the outlet at all — so match on the feed's streamId (which
 * carries the source domain) first, then fall back to a title heuristic.
 */
const FEED_NAME_BY_STREAM: [match: string, name: string][] = [
  ['bbc.com', 'BBC'],
  ['theguardian.com', 'The Guardian'],
  ['nbcsports.com', 'NBC Sports'],
  ['nytimes.com', 'The Athletic'], // folder's NYT feed is the Athletic World Cup feed
  ['apnews.com', 'AP News'],
];

function cleanFeedTitle(streamId: string | undefined, title: string | undefined): string {
  const sid = streamId ?? '';
  for (const [match, name] of FEED_NAME_BY_STREAM) {
    if (sid.includes(match)) return name;
  }
  const t = (title ?? '').trim();
  if (!t) return 'RSS';
  // Fallback: outlet usually trails a "|" or " - " separator.
  const sep = t.match(/.*[|‹›·–—-]\s*(.+)$/);
  if (sep?.[1] && sep[1].length <= 30) return sep[1].trim();
  return t;
}

/** Inoreader categories include system tags + user labels; keep only the human labels. */
function extractLabels(categories: string[] | undefined): string[] {
  if (!Array.isArray(categories)) return [];
  return categories
    .filter((c) => c.includes('/label/'))
    .map((c) => c.split('/label/')[1])
    .filter(Boolean);
}

/** Map one raw Inoreader item to the unified NewsItem shape. */
export function normalizeInoreaderItem(raw: InoreaderItemRaw): NewsItem | null {
  const rawUrl = raw.canonical?.[0]?.href ?? raw.alternate?.[0]?.href ?? '';
  const url = decodeEntities(rawUrl);
  const title = decodeEntities((raw.title ?? '').trim());
  // An item with neither a link nor a title is unusable.
  if (!url || !title) return null;

  const publishedSec = typeof raw.published === 'number' ? raw.published : Math.floor(Date.now() / 1000);
  const feedTitle = cleanFeedTitle(raw.origin?.streamId, raw.origin?.title);

  return {
    id: raw.id || url,
    source: 'inoreader',
    feedTitle,
    title,
    summary: htmlToText(raw.summary?.content ?? ''),
    url,
    author: raw.author?.trim() || null,
    published: new Date(publishedSec * 1000).toISOString(),
    imageUrl: raw.enclosure?.[0]?.href ? decodeEntities(raw.enclosure[0].href) : null,
    categories: extractLabels(raw.categories),
    premium: false,
    section: feedTitle,
  };
}

/* -------------------------------- fetching -------------------------------- */

/**
 * Fetch + normalize the configured Inoreader stream. Returns [] (and logs) on
 * any failure so the news page degrades gracefully to ESPN-only.
 */
export async function fetchInoreaderNews(): Promise<NewsItem[]> {
  const cfg = getInoreaderConfig();
  if (!cfg) return [];

  const streamPath = encodeURIComponent(cfg.stream);
  const url = `${API_BASE}/stream/contents/${streamPath}?n=${cfg.itemCount}`;

  try {
    let data = await getCache<InoreaderStreamResponse>('news-inoreader-raw');
    if (!data) {
      data = await fetchStream(cfg, url);
      await setCache('news-inoreader-raw', data, NEWS_TTL);
    }
    const items = data.items ?? [];
    return items
      .map(normalizeInoreaderItem)
      .filter((x): x is NewsItem => x !== null);
  } catch (err) {
    console.error('[inoreader] fetch failed:', err instanceof Error ? err.message : err);
    return [];
  }
}

/**
 * GET the stream with a Bearer access token. On 401 (expired/invalid token),
 * force a refresh once and retry — covers the case where a cached access token
 * looked valid but the server rejected it.
 */
async function fetchStream(cfg: InoreaderConfig, url: string): Promise<InoreaderStreamResponse> {
  let token = await getAccessToken(cfg);
  let res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });

  if (res.status === 401) {
    token = await getAccessToken(cfg, true);
    res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
  }

  if (!res.ok) throw new Error(`Inoreader stream fetch failed: ${res.status} ${url}`);
  return res.json();
}
