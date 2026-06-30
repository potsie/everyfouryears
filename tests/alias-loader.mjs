// Resolve the project's "@/..." path alias (tsconfig paths: @/* -> ./src/*) for
// tests run under `node --experimental-strip-types`. Type-only "@/" imports get
// stripped, but value imports (e.g. isTBD from @/lib/bracket-data) need this.
// Usage: node --import ./tests/alias-loader.mjs --experimental-strip-types <test>
import { register } from 'node:module';
import { pathToFileURL, fileURLToPath } from 'node:url';
import { dirname, resolve as resolvePath, extname } from 'node:path';
import { existsSync } from 'node:fs';

const SRC = resolvePath(dirname(fileURLToPath(import.meta.url)), '..', 'src');

register(pathToFileURL(import.meta.filename));

export async function resolve(specifier, context, next) {
  if (specifier.startsWith('@/')) {
    let p = resolvePath(SRC, specifier.slice(2));
    if (!extname(p)) {
      if (existsSync(`${p}.ts`)) p = `${p}.ts`;
      else if (existsSync(resolvePath(p, 'index.ts'))) p = resolvePath(p, 'index.ts');
    }
    return next(pathToFileURL(p).href, context);
  }
  return next(specifier, context);
}
