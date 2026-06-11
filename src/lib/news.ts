/**
 * Unified news layer.
 *
 * ESPN news and Inoreader news are normalized into one source-agnostic
 * `NewsItem` shape, merged, deduped (ESPN wins ties), and sorted newest-first.
 * The merged feed is written to the file cache in the shape the project doc
 * specifies, and returned for page rendering.
 *
 * Server-side only (pulls Inoreader via credentials in env).
 */
import { fetchNews as fetchEspnNews, fetchTeamNews, type NewsArticle } from '@/lib/espn/wc-fetchers';
import { fetchInoreaderNews } from '@/lib/inoreader';
import { getCache, setCache } from '@/lib/cache';

/** Source-agnostic news item. The single shape every list component renders. */
export interface NewsItem {
  id: string;
  source: 'espn' | 'inoreader';
  /** Outlet name for the attribution badge: "ESPN", "BBC Sport - Football", … */
  feedTitle: string;
  title: string;
  /** Plain-text, truncated. Snippet only — never full article text. */
  summary: string;
  /** Canonical outbound link. */
  url: string;
  author: string | null;
  /** ISO 8601 UTC — the merge sort key. */
  published: string;
  imageUrl: string | null;
  categories: string[];
  /** ESPN-only extras (kept so the existing UI can still show them). */
  premium?: boolean;
  section?: string;
}

/** Cached merged feed, matching the doc's file shape. */
export interface MergedNewsFeed {
  generatedAt: string;
  sources: {
    espn: { count: number; ok: boolean };
    inoreader: { count: number; ok: boolean; stream: string };
  };
  items: NewsItem[];
}

const MERGED_CACHE_KEY = 'news-merged';
const MERGED_TTL = 600; // 10 min — matches the ESPN news cadence
const INOREADER_STREAM = process.env.INOREADER_STREAM || 'user/-/label/World Cup';

/* ---------------------------- ESPN → NewsItem ----------------------------- */

/** Adapt an existing ESPN NewsArticle to the unified shape. */
export function espnToNewsItem(a: NewsArticle): NewsItem {
  return {
    id: `espn:${a.id}`,
    source: 'espn',
    feedTitle: 'ESPN',
    title: a.headline,
    summary: a.description,
    url: a.href,
    author: a.byline || null,
    published: a.published,
    imageUrl: a.imageUrl,
    categories: a.section ? [a.section] : [],
    premium: a.premium,
    section: a.section,
  };
}

/* ------------------------------ dedup helpers ----------------------------- */

const TRACKING_PARAMS = /^(utm_|fbclid$|gclid$|mc_|ref$|ref_src$|src$|cmp$|icid$)/i;

/** Normalize a URL into a dedup key: lowercase host, drop tracking params + hash + trailing slash. */
export function canonicalUrlKey(rawUrl: string): string {
  try {
    const u = new URL(rawUrl);
    u.hash = '';
    u.host = u.host.toLowerCase();
    u.protocol = 'https:';
    for (const key of [...u.searchParams.keys()]) {
      if (TRACKING_PARAMS.test(key)) u.searchParams.delete(key);
    }
    let out = u.toString();
    out = out.replace(/\/$/, '');
    return out;
  } catch {
    return rawUrl.trim().toLowerCase();
  }
}

/** Loose title key for the fuzzy fallback: lowercase alphanumerics only. */
function titleKey(title: string): string {
  return title.toLowerCase().replace(/[^a-z0-9]+/g, '');
}

const FUZZY_WINDOW_MS = 48 * 60 * 60 * 1000; // same story within 48h

/**
 * Merge ESPN + Inoreader items. Dedup primarily on canonical URL, with a
 * fuzzy title fallback inside a 48h window. ESPN wins ties (richer internal
 * linking). Input order matters: pass ESPN first.
 */
export function mergeAndDedup(espn: NewsItem[], inoreader: NewsItem[]): NewsItem[] {
  const byUrl = new Map<string, NewsItem>();
  const titleTimes: { key: string; time: number }[] = [];
  const result: NewsItem[] = [];

  const consider = (item: NewsItem) => {
    const urlKey = canonicalUrlKey(item.url);
    if (byUrl.has(urlKey)) return; // exact canonical dup — first (ESPN) wins

    const tKey = titleKey(item.title);
    const t = new Date(item.published).getTime();
    if (tKey) {
      const dup = titleTimes.some(
        (e) => e.key === tKey && Math.abs(e.time - t) <= FUZZY_WINDOW_MS,
      );
      if (dup) return; // fuzzy title dup within window
      titleTimes.push({ key: tKey, time: t });
    }

    byUrl.set(urlKey, item);
    result.push(item);
  };

  // ESPN first so it wins every tie.
  espn.forEach(consider);
  inoreader.forEach(consider);

  result.sort((a, b) => new Date(b.published).getTime() - new Date(a.published).getTime());
  return result;
}

/* ------------------------------- public API ------------------------------ */

/**
 * Build the merged feed: fetch both sources in parallel, normalize, merge,
 * dedup, sort, and persist the doc-shaped JSON to the file cache. Each source
 * fails independently — a dead Inoreader stream still yields ESPN news.
 */
export async function getMergedNews(): Promise<MergedNewsFeed> {
  const cached = await getCache<MergedNewsFeed>(MERGED_CACHE_KEY);
  if (cached) return cached;

  const [espnRes, inoRes] = await Promise.allSettled([
    fetchEspnNews(),
    fetchInoreaderNews(),
  ]);

  const espnOk = espnRes.status === 'fulfilled';
  const espnItems: NewsItem[] = espnOk ? espnRes.value.map(espnToNewsItem) : [];

  // fetchInoreaderNews already swallows its own errors → [], but guard anyway.
  const inoOk = inoRes.status === 'fulfilled';
  const inoItems: NewsItem[] = inoOk ? inoRes.value : [];

  const items = mergeAndDedup(espnItems, inoItems);

  const feed: MergedNewsFeed = {
    generatedAt: new Date().toISOString(),
    sources: {
      espn: { count: espnItems.length, ok: espnOk },
      inoreader: { count: inoItems.length, ok: inoOk, stream: INOREADER_STREAM },
    },
    items,
  };

  await setCache(MERGED_CACHE_KEY, feed, MERGED_TTL);
  return feed;
}

/* ----------------------------- per-team news ------------------------------ */

/**
 * Extra match terms beyond the country display name, keyed by ESPN abbr. Only
 * the teams whose plain country name misses (accents, alternate spellings,
 * common short forms). Kept deliberately tight to avoid false positives —
 * no bare 2-letter codes, no player surnames. Country name + supplemental
 * nickname are added automatically in matchTermsForTeam().
 */
const TEAM_NEWS_ALIASES: Record<string, string[]> = {
  USA: ['United States', 'USMNT', 'USA'],
  KOR: ['South Korea', 'Korea'],
  TUR: ['Turkey', 'Türkiye'],
  CIV: ['Ivory Coast', "Cote d'Ivoire", 'Côte d’Ivoire'],
  COD: ['Congo DR', 'DR Congo', 'DRC'],
  BIH: ['Bosnia', 'Herzegovina'],
  CZE: ['Czechia', 'Czech Republic'],
  CPV: ['Cape Verde', 'Cabo Verde'],
  CUW: ['Curacao', 'Curaçao'],
  NED: ['Netherlands', 'Dutch', 'Oranje'],
  KSA: ['Saudi Arabia', 'Saudi'],
  NZL: ['New Zealand'],
  RSA: ['South Africa'],
};

/** Build the set of title-match terms for a team. */
export function matchTermsForTeam(abbr: string, teamName: string, nickname?: string | null): string[] {
  const terms = new Set<string>();
  if (teamName) terms.add(teamName);
  if (nickname) terms.add(nickname);
  for (const t of TEAM_NEWS_ALIASES[abbr.toUpperCase()] ?? []) terms.add(t);
  return [...terms].filter((t) => t.trim().length >= 3);
}

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/** Keep items whose TITLE contains any term, matched on word boundaries (case-insensitive). */
export function filterItemsForTeam(items: NewsItem[], terms: string[]): NewsItem[] {
  if (terms.length === 0) return [];
  const re = new RegExp(`\\b(${terms.map(escapeRegex).join('|')})\\b`, 'i');
  return items.filter((it) => re.test(it.title));
}

/**
 * Team-page "Latest news": ESPN's team-filtered articles plus Inoreader stories
 * whose headline names the team, merged (ESPN wins), deduped, newest-first.
 * Each source fails independently. Returns up to `limit` items.
 */
export async function fetchTeamNewsMerged(
  espnId: string,
  opts: { abbr: string; teamName: string; nickname?: string | null; limit?: number },
): Promise<NewsItem[]> {
  const [espnRes, inoRes] = await Promise.allSettled([
    fetchTeamNews(espnId),
    fetchInoreaderNews(),
  ]);

  const espnItems = espnRes.status === 'fulfilled' ? espnRes.value.map(espnToNewsItem) : [];
  const inoAll = inoRes.status === 'fulfilled' ? inoRes.value : [];

  const terms = matchTermsForTeam(opts.abbr, opts.teamName, opts.nickname);
  const inoMatched = filterItemsForTeam(inoAll, terms);

  return mergeAndDedup(espnItems, inoMatched).slice(0, opts.limit ?? 6);
}
