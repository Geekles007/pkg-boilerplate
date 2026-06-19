/**
 * Copies the compiled registry (registry/public/r) into this app's public/r so
 * the deployed site serves the registry JSON the CLI fetches. Runs before
 * `dev` and `build`. No-op (with a hint) if the registry hasn't been built yet.
 */
import { access, cp, mkdir, rm } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const src = join(here, '..', '..', '..', 'registry', 'public', 'r');
const dest = join(here, '..', 'public', 'r');

try {
  await access(src);
} catch {
  console.warn(
    '[copy-registry] registry/public/r not found — run `pnpm registry:build` first. Skipping.',
  );
  process.exit(0);
}

await rm(dest, { recursive: true, force: true });
await mkdir(dest, { recursive: true });
await cp(src, dest, { recursive: true });
console.log(`[copy-registry] copied registry into ${dest}`);
