import { promises as fs } from 'fs';
import path from 'path';
import type { PmsrData } from './pmsr';

export async function getPmsr(eventId: string): Promise<PmsrData | null> {
  try {
    const file = path.join(process.cwd(), 'data', 'pmsr', `${eventId}.json`);
    return JSON.parse(await fs.readFile(file, 'utf8')) as PmsrData;
  } catch {
    return null;
  }
}

export async function getAllPmsr(): Promise<PmsrData[]> {
  try {
    const dir = path.join(process.cwd(), 'data', 'pmsr');
    const files = await fs.readdir(dir);
    const results = await Promise.all(
      files
        .filter(f => f.endsWith('.json') && f !== 'name-overrides.json')
        .map(async f => {
          try {
            return JSON.parse(await fs.readFile(path.join(dir, f), 'utf8')) as PmsrData;
          } catch {
            return null;
          }
        }),
    );
    return results.filter((r): r is PmsrData => r !== null);
  } catch {
    return [];
  }
}
