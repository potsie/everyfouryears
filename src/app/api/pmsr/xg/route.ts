import { NextResponse } from 'next/server';
import { getAllPmsr } from '@/lib/pmsr.server';

export async function GET() {
  const allPmsr = await getAllPmsr();
  const out: Record<string, { home: number; away: number }> = {};
  for (const d of allPmsr) {
    if (d.eventId && d.home.xg !== null && d.away.xg !== null) {
      out[d.eventId] = { home: d.home.xg, away: d.away.xg };
    }
  }
  return NextResponse.json(out, {
    headers: { 'Cache-Control': 's-maxage=300, stale-while-revalidate=60' },
  });
}
