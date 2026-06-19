import {
  type RegistryIndex,
  type RegistryItem,
  registryIndexSchema,
  registryItemSchema,
} from './schema.js';

/** Strip trailing slashes so we can join paths predictably. */
export function normalizeBaseUrl(baseUrl: string): string {
  return baseUrl.replace(/\/+$/, '');
}

/** URL of the published index for a given registry base URL. */
export function indexUrl(baseUrl: string): string {
  return `${normalizeBaseUrl(baseUrl)}/r/index.json`;
}

/** URL of a single published item for a given registry base URL. */
export function itemUrl(baseUrl: string, name: string): string {
  return `${normalizeBaseUrl(baseUrl)}/r/${name}.json`;
}

type FetchLike = (input: string) => Promise<{
  ok: boolean;
  status: number;
  json: () => Promise<unknown>;
}>;

interface FetchOptions {
  /** Inject a fetch implementation (defaults to global `fetch`). */
  fetch?: FetchLike;
}

function resolveFetch(options?: FetchOptions): FetchLike {
  const impl = options?.fetch ?? (globalThis.fetch as FetchLike | undefined);
  if (!impl) {
    throw new Error('No fetch implementation available. Pass `{ fetch }` or run on Node >= 18.');
  }
  return impl;
}

/** Fetch and validate the registry index from a base URL. */
export async function fetchRegistryIndex(
  baseUrl: string,
  options?: FetchOptions,
): Promise<RegistryIndex> {
  const fetchImpl = resolveFetch(options);
  const res = await fetchImpl(indexUrl(baseUrl));
  if (!res.ok) {
    throw new Error(`Failed to fetch registry index (${res.status}).`);
  }
  return registryIndexSchema.parse(await res.json());
}

/** Fetch and validate a single registry item from a base URL. */
export async function fetchRegistryItem(
  baseUrl: string,
  name: string,
  options?: FetchOptions,
): Promise<RegistryItem> {
  const fetchImpl = resolveFetch(options);
  const res = await fetchImpl(itemUrl(baseUrl, name));
  if (!res.ok) {
    throw new Error(`Registry item "${name}" not found (${res.status}).`);
  }
  return registryItemSchema.parse(await res.json());
}

/**
 * Resolve an item and all of its transitive `registryDependencies` into a flat,
 * de-duplicated, install-ordered list (dependencies before dependents).
 */
export async function resolveItemTree(
  baseUrl: string,
  names: string[],
  options?: FetchOptions,
): Promise<RegistryItem[]> {
  const resolved = new Map<string, RegistryItem>();
  const ordered: RegistryItem[] = [];

  async function visit(name: string, stack: string[]): Promise<void> {
    if (stack.includes(name)) {
      throw new Error(`Circular registry dependency: ${[...stack, name].join(' -> ')}`);
    }
    if (resolved.has(name)) return;
    const item = await fetchRegistryItem(baseUrl, name, options);
    resolved.set(name, item);
    for (const dep of item.registryDependencies) {
      await visit(dep, [...stack, name]);
    }
    ordered.push(item);
  }

  for (const name of names) {
    await visit(name, []);
  }
  return ordered;
}
