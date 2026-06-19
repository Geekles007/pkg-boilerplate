import { describe, expect, it } from 'vitest';
import {
  type RegistryItem,
  fetchRegistryItem,
  indexUrl,
  itemUrl,
  normalizeBaseUrl,
  registryItemSchema,
  resolveItemTree,
} from './index.js';

function makeItem(partial: Partial<RegistryItem> & { name: string }): RegistryItem {
  return registryItemSchema.parse({
    files: [{ path: `src/${partial.name}.ts`, content: '// noop\n' }],
    ...partial,
  });
}

/** Build a fake fetch backed by an in-memory registry. */
function fakeFetch(items: Record<string, RegistryItem>) {
  return async (input: string) => {
    const match = input.match(/\/r\/(.+)\.json$/);
    const name = match?.[1];
    const item = name ? items[name] : undefined;
    return {
      ok: Boolean(item),
      status: item ? 200 : 404,
      json: async () => item,
    };
  };
}

describe('url helpers', () => {
  it('normalizes trailing slashes', () => {
    expect(normalizeBaseUrl('https://x.dev///')).toBe('https://x.dev');
  });

  it('builds index and item urls', () => {
    expect(indexUrl('https://x.dev')).toBe('https://x.dev/r/index.json');
    expect(itemUrl('https://x.dev/', 'button')).toBe('https://x.dev/r/button.json');
  });
});

describe('schema defaults', () => {
  it('fills empty dependency arrays', () => {
    const item = makeItem({ name: 'button' });
    expect(item.dependencies).toEqual([]);
    expect(item.registryDependencies).toEqual([]);
    expect(item.files[0]?.type).toBe('file');
  });
});

describe('fetchRegistryItem', () => {
  it('throws on a missing item', async () => {
    const fetch = fakeFetch({});
    await expect(fetchRegistryItem('https://x.dev', 'nope', { fetch })).rejects.toThrow(
      /not found/,
    );
  });
});

describe('resolveItemTree', () => {
  it('orders dependencies before dependents and de-duplicates', async () => {
    const items = {
      utils: makeItem({ name: 'utils' }),
      button: makeItem({ name: 'button', registryDependencies: ['utils'] }),
      card: makeItem({ name: 'card', registryDependencies: ['utils', 'button'] }),
    };
    const tree = await resolveItemTree('https://x.dev', ['card'], {
      fetch: fakeFetch(items),
    });
    expect(tree.map((i) => i.name)).toEqual(['utils', 'button', 'card']);
  });

  it('detects circular dependencies', async () => {
    const items = {
      a: makeItem({ name: 'a', registryDependencies: ['b'] }),
      b: makeItem({ name: 'b', registryDependencies: ['a'] }),
    };
    await expect(
      resolveItemTree('https://x.dev', ['a'], { fetch: fakeFetch(items) }),
    ).rejects.toThrow(/Circular/);
  });
});
