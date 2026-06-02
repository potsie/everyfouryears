import { NextResponse } from 'next/server';
import { normalizeScoreboardEvent } from '@/lib/normalize/world-cup-normalizer';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const date = searchParams.get('date');

  const url = date
    ? `https://site.api.espn.com/apis/site/v2/sports/soccer/fifa.world/scoreboard?dates=${date}&limit=50`
    : 'https://site.api.espn.com/apis/site/v2/sports/soccer/fifa.world/scoreboard?dates=20260611-20260720&limit=200';

  try {
    const res = await fetch(url, { cache: 'no-store' });
    if (!res.ok) throw new Error(`ESPN returned ${res.status}`);
    const data = await res.json();
    const normalized = (data.events ?? []).map(normalizeScoreboardEvent);
    return NextResponse.json(normalized);
  } catch (err) {
    return NextResponse.json({ error: 'Failed to fetch match data' }, { status: 500 });
  }
}
