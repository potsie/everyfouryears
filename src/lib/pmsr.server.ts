import { promises as fs } from 'fs';
import path from 'path';
import type { PmsrData } from './pmsr';

// Server-only loader for parsed FIFA PMSR JSON. Kept separate from pmsr.ts so
// client components can import the pure helpers/types without bundling `fs`.
export async function getPmsr(eventId: string): Promise<PmsrData | null> {
  try {
    const file = path.join(process.cwd(), 'data', 'pmsr', `${eventId}.json`);
    return JSON.parse(await fs.readFile(file, 'utf8')) as PmsrData;
  } catch {
    return null; // no report yet (pre-match, or not parsed) — page renders without it
  }
}
