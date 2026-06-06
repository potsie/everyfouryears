import { fetchTeamColors } from '@/lib/espn/wc-fetchers';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const espnId = searchParams.get('espnId');
  if (!espnId) return Response.json(null);

  const colors = await fetchTeamColors(espnId);
  return Response.json(colors, {
    headers: { 'Cache-Control': 'public, max-age=86400' },
  });
}
