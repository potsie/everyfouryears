import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { fetchAllMatches, fetchFifaSquads } from '@/lib/espn/wc-fetchers';
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

    // Build `${teamAbbr}|${jersey}` → FIFA player id map so leaders can link to
    // /player/{fifaId}. Best-effort — never fail stats if FIFA squads are down.
    const fifaIdByKey = new Map<string, string>();
    try {
      const squads = await fetchFifaSquads();
      for (const squad of squads) {
        for (const p of squad.players) {
          if (p.jerseyNum != null) fifaIdByKey.set(`${squad.countryCode}|${p.jerseyNum}`, p.fifaId);
        }
      }
    } catch (e) {
      console.warn('[/api/stats] FIFA squad join skipped:', e);
    }

    const stats = buildTournamentStats(summaries, dobMap, totalGoals, fifaIdByKey);

    // Attach scorer headshots from players-clubs.json (keyed by FIFA id), the
    // same source the team roster pages use. Best-effort.
    try {
      const clubsPath = path.join(process.cwd(), 'data', 'players-clubs.json');
      const clubs: Record<string, { photoUrl: string | null }> = JSON.parse(fs.readFileSync(clubsPath, 'utf-8'));
      for (const s of stats.goldenBoot) {
        const photo = s.fifaId ? clubs[s.fifaId]?.photoUrl : null;
        if (photo) s.photo = photo;
      }
    } catch (e) {
      console.warn('[/api/stats] player photo join skipped:', e);
    }

    return NextResponse.json(stats, {
      headers: { 'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600' },
    });
  } catch (err) {
    console.error('[/api/stats]', err);
    return NextResponse.json({ error: 'Failed to build stats' }, { status: 500 });
  }
}
