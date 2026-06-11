#!/usr/bin/env node
/**
 * Live Inoreader smoke test. Validates auth, the stream, and normalization
 * end-to-end — independent of the Next app. Disposable; delete when done.
 *
 *   node --env-file=.env.local scripts/test-inoreader.mjs
 *
 * Mirrors the auth + normalization in src/lib/inoreader.ts.
 */
const clientId = process.env.INOREADER_CLIENT_ID;
const clientSecret = process.env.INOREADER_CLIENT_SECRET;
const refreshToken = process.env.INOREADER_REFRESH_TOKEN;
const stream = process.env.INOREADER_STREAM || 'user/-/label/World Cup';
const n = process.env.INOREADER_ITEM_COUNT || 50;

if (!clientId || !clientSecret || !refreshToken) {
  console.error('Missing INOREADER_CLIENT_ID / INOREADER_CLIENT_SECRET / INOREADER_REFRESH_TOKEN in .env.local');
  console.error('Run scripts/get-inoreader-token.mjs first to obtain the refresh token.');
  process.exit(1);
}

// Exchange the refresh token for an access token (Bearer auth).
const tokenRes = await fetch('https://www.inoreader.com/oauth2/token', {
  method: 'POST',
  headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  body: new URLSearchParams({
    client_id: clientId,
    client_secret: clientSecret,
    grant_type: 'refresh_token',
    refresh_token: refreshToken,
  }),
});
const tokenData = await tokenRes.json().catch(() => ({}));
if (!tokenRes.ok || !tokenData.access_token) {
  console.error(`✗ Token refresh failed: ${tokenRes.status} ${tokenData.error ?? ''} ${tokenData.error_description ?? ''}`);
  process.exit(1);
}
const accessToken = tokenData.access_token;
console.log(`✓ Got access token (expires in ${tokenData.expires_in ?? '?'}s)\n`);

const ENTITIES = { '&amp;': '&', '&lt;': '<', '&gt;': '>', '&quot;': '"', '&#39;': "'", '&apos;': "'", '&nbsp;': ' ' };
function decodeEntities(s) {
  return s
    .replace(/&#(\d+);/g, (_, c) => String.fromCharCode(Number(c)))
    .replace(/&#x([0-9a-f]+);/gi, (_, c) => String.fromCharCode(parseInt(c, 16)))
    .replace(/&[a-z]+;/gi, (m) => ENTITIES[m.toLowerCase()] ?? m);
}
function htmlToText(html, maxLen = 280) {
  if (!html) return '';
  let t = decodeEntities(
    html
      .replace(/<\s*(script|style)[^>]*>[\s\S]*?<\/\s*\1\s*>/gi, '')
      .replace(/<[^>]+>/g, ' '),
  )
    .replace(/\s+/g, ' ')
    .trim();
  if (t.length > maxLen) t = t.slice(0, maxLen).replace(/\s+\S*$/, '').trimEnd() + '…';
  return t;
}

const url = `https://www.inoreader.com/reader/api/0/stream/contents/${encodeURIComponent(stream)}?n=${n}`;
console.log(`→ GET ${url}\n  stream: "${stream}"\n`);

const res = await fetch(url, {
  headers: { Authorization: `Bearer ${accessToken}` },
});
console.log(`HTTP ${res.status} ${res.statusText}`);
if (!res.ok) {
  console.error('Body:', (await res.text()).slice(0, 500));
  process.exit(1);
}

const data = await res.json();
const items = data.items ?? [];
console.log(`Stream title: ${data.title ?? '(none)'}`);
console.log(`Items returned: ${items.length}\n`);

for (const raw of items.slice(0, 5)) {
  const u = decodeEntities(raw.canonical?.[0]?.href ?? raw.alternate?.[0]?.href ?? '');
  console.log('─'.repeat(70));
  console.log(`feedTitle : ${raw.origin?.title ?? 'RSS'}`);
  console.log(`title     : ${decodeEntities((raw.title ?? '').trim())}`);
  console.log(`published : ${new Date((raw.published ?? 0) * 1000).toISOString()}`);
  console.log(`author    : ${raw.author?.trim() || '(none)'}`);
  console.log(`url       : ${u}`);
  console.log(`image     : ${raw.enclosure?.[0]?.href ? decodeEntities(raw.enclosure[0].href) : '(none)'}`);
  console.log(`summary   : ${htmlToText(raw.summary?.content ?? '').slice(0, 160)}`);
}
console.log('─'.repeat(70));
console.log('\n✓ Live fetch + normalization OK.');
