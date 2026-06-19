import { fetchRegistryIndex } from '@pkg-boilerplate/core';
import { bold, dim } from 'kleur/colors';
import { resolveRegistry } from '../config.js';
import { nodeFetch } from '../fetch.js';

export interface ListOptions {
  registry?: string;
}

export async function list(options: ListOptions): Promise<void> {
  const baseUrl = resolveRegistry(options.registry);
  const index = await fetchRegistryIndex(baseUrl, { fetch: nodeFetch });

  console.log(bold(`${index.name} — ${index.items.length} item(s)\n`));
  for (const item of index.items) {
    const desc = item.description ? ` ${dim(`— ${item.description}`)}` : '';
    console.log(`  ${item.name}${desc}`);
  }
}
