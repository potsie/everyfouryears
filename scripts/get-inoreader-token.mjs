#!/usr/bin/env node
/**
 * One-time Inoreader OAuth2 authorization. Exchanges your client id/secret for
 * a long-lived REFRESH TOKEN, which the app then uses to mint access tokens.
 *
 *   node --env-file=.env.local scripts/get-inoreader-token.mjs
 *
 * Requires INOREADER_CLIENT_ID, INOREADER_CLIENT_SECRET, and
 * INOREADER_REDIRECT_URI (must EXACTLY match a redirect URI registered on your
 * OAuth app) in .env.local. Run once, paste the resulting refresh token into
 * INOREADER_REFRESH_TOKEN, then delete this script.
 */
import { createInterface } from 'node:readline/promises';
import { randomBytes } from 'node:crypto';

const clientId = process.env.INOREADER_CLIENT_ID;
const clientSecret = process.env.INOREADER_CLIENT_SECRET;
const redirectUri = process.env.INOREADER_REDIRECT_URI;

if (!clientId || !clientSecret || !redirectUri) {
  console.error('Set INOREADER_CLIENT_ID, INOREADER_CLIENT_SECRET, and INOREADER_REDIRECT_URI in .env.local first.');
  process.exit(1);
}

const state = randomBytes(8).toString('hex');
const authUrl =
  'https://www.inoreader.com/oauth2/auth?' +
  new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: 'read',
    state,
  });

console.log('\n1. Open this URL in your browser and authorize the app:\n');
console.log('   ' + authUrl + '\n');
console.log(`2. You'll be redirected to ${redirectUri}?code=...&state=...`);
console.log('   (If that URL 404s, that\'s fine — the code is in the address bar.)\n');

const rl = createInterface({ input: process.stdin, output: process.stdout });
const pasted = (await rl.question('3. Paste the full redirected URL (or just the code): ')).trim();
rl.close();

let code = pasted;
try {
  const u = new URL(pasted);
  code = u.searchParams.get('code') ?? pasted;
  const returnedState = u.searchParams.get('state');
  if (returnedState && returnedState !== state) {
    console.error('\n✗ state mismatch — possible CSRF. Aborting.');
    process.exit(1);
  }
} catch {
  // Not a full URL; assume the user pasted the bare code.
}

if (!code) {
  console.error('\n✗ No authorization code found.');
  process.exit(1);
}

const res = await fetch('https://www.inoreader.com/oauth2/token', {
  method: 'POST',
  headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  body: new URLSearchParams({
    code,
    client_id: clientId,
    client_secret: clientSecret,
    redirect_uri: redirectUri,
    scope: 'read',
    grant_type: 'authorization_code',
  }),
});

const data = await res.json().catch(() => ({}));
if (!res.ok || !data.refresh_token) {
  console.error(`\n✗ Token exchange failed: ${res.status} ${data.error ?? ''} ${data.error_description ?? ''}`);
  process.exit(1);
}

console.log('\n✓ Success. Add this line to .env.local:\n');
console.log(`INOREADER_REFRESH_TOKEN=${data.refresh_token}\n`);
console.log(`(access token expires in ${data.expires_in ?? '?'}s — the app refreshes it automatically.)`);
