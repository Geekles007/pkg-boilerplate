import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

/**
 * Node-aware fetch passed to the (browser-safe) core helpers. Adds `file://`
 * support so the registry can be tested locally without a running server:
 *
 *   pkg-boilerplate list --registry "file://$(pwd)/registry/public"
 */
export async function nodeFetch(input: string) {
  if (input.startsWith('file://')) {
    try {
      const content = await readFile(fileURLToPath(input), 'utf8');
      return { ok: true, status: 200, json: async () => JSON.parse(content) };
    } catch {
      return { ok: false, status: 404, json: async () => null };
    }
  }
  const res = await fetch(input);
  return { ok: res.ok, status: res.status, json: () => res.json() };
}
