import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { fetchAllMatches } from '@/lib/espn/wc-fetchers';
import { espnFetch } from '@/lib/espn/core';
import { buildTournamentStats } from '@/lib/stats-live';
import type { ESPNMatchSummaryFull } from '@/types/world-cup-types';

export async function GET() {
  try {
    // Build athleteId → dateOfBirth map from static rosters file
    const rostersPath = path.join(process.cwd(), 'data', 'world_cup_2026_rosters.json');
    const rostersRaw = fs.readFileSync(rostersPath, 'utf-8');
    const rosters: { roster: { id: string; dateOfBirth: string | null }[] }[] = JSON.parse(rostersRaw);
    const dobMap = new Map<string, string>();
    for (const team of rosters) {
      for (const player of team.roster) {
        if (player.id && player.dateOfBirth) dobMap.set(player.id, player.dateOfBirth);
      }
    }

    // Fetch all matches and filter to completed
    const { matches } = await fetchAllMatches();
    const completed = matches.filter(m => m.status.state === 'post');

    // Total goals from scoreboard — source of truth, avoids double-counting boxscore
    const totalGoals = completed.reduce((sum, m) => {
      return sum + (parseInt(m.home.score) || 0) + (parseInt(m.away.score) || 0);
    }, 0);

    // Fetch summaries for completed matches; no TTL = cache forever
    const summaries = await Promise.all(
      completed.map(m =>
        espnFetch<ESPNMatchSummaryFull>(
          `https://site.api.espn.com/apis/site/v2/sports/soccer/fifa.world/summary?event=${m.eventId}`,
          `wc-match-${m.eventId}`,
          undefined,
        ),
      ),
    );

    const stats = buildTournamentStats(summaries, dobMap, totalGoals);

    return NextResponse.json(stats, {
      headers: { 'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600' },
    });
  } catch (err) {
    console.error('[/api/stats]', err);
    return NextResponse.json({ error: 'Failed to build stats' }, { status: 500 });
  }
}
