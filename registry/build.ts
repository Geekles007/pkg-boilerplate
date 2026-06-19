/**
 * Compiles every item under `items/<name>/` into a static JSON registry under
 * `public/r/`. The output is plain files — serve them from GitHub Pages, a CDN,
 * or anywhere static. No database, no backend.
 *
 *   items/<name>/meta.json        item metadata + file map
 *   items/<name>/files/...        the source files shipped to consumers
 *
 *   public/r/index.json           list of every item
 *   public/r/<name>.json          one resolved RegistryItem per item
 */
import { mkdir, readFile, readdir, rm, stat, writeFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  type RegistryIndex,
  type RegistryItem,
  registryIndexSchema,
  registryItemSchema,
} from '@pkg-boilerplate/core';

const ROOT = dirname(fileURLToPath(import.meta.url));
const ITEMS_DIR = join(ROOT, 'items');
const OUT_DIR = join(ROOT, 'public', 'r');

const REGISTRY_NAME = 'pkg-boilerplate';
const HOMEPAGE = 'https://Geekles007.github.io/pkg-boilerplate';

interface MetaFile {
  from: string;
  path: string;
  type?: string;
}

interface ItemMeta {
  name: string;
  type?: string;
  description?: string;
  dependencies?: string[];
  devDependencies?: string[];
  registryDependencies?: string[];
  files: MetaFile[];
}

async function readJson<T>(path: string): Promise<T> {
  return JSON.parse(await readFile(path, 'utf8')) as T;
}

async function listItemDirs(): Promise<string[]> {
  const entries = await readdir(ITEMS_DIR, { withFileTypes: true });
  return entries.filter((e) => e.isDirectory()).map((e) => e.name);
}

async function buildItem(dir: string): Promise<RegistryItem> {
  const itemRoot = join(ITEMS_DIR, dir);
  const meta = await readJson<ItemMeta>(join(itemRoot, 'meta.json'));

  const files = await Promise.all(
    meta.files.map(async (file) => {
      const source = join(itemRoot, file.from);
      await stat(source); // fail loudly if a referenced file is missing
      return {
        path: file.path,
        content: await readFile(source, 'utf8'),
        type: file.type ?? 'file',
      };
    }),
  );

  return registryItemSchema.parse({
    name: meta.name,
    type: meta.type ?? 'component',
    description: meta.description,
    dependencies: meta.dependencies ?? [],
    devDependencies: meta.devDependencies ?? [],
    registryDependencies: meta.registryDependencies ?? [],
    files,
  });
}

async function main(): Promise<void> {
  await rm(OUT_DIR, { recursive: true, force: true });
  await mkdir(OUT_DIR, { recursive: true });

  const dirs = await listItemDirs();
  const items: RegistryItem[] = [];

  for (const dir of dirs) {
    const item = await buildItem(dir);
    if (items.some((i) => i.name === item.name)) {
      throw new Error(`Duplicate registry item name: "${item.name}"`);
    }
    items.push(item);
    await writeFile(join(OUT_DIR, `${item.name}.json`), `${JSON.stringify(item, null, 2)}\n`);
  }

  const index: RegistryIndex = registryIndexSchema.parse({
    $schema: 'https://pkg-boilerplate/schema/registry-index.json',
    name: REGISTRY_NAME,
    homepage: HOMEPAGE,
    items: items
      .map((i) => ({ name: i.name, type: i.type, description: i.description }))
      .sort((a, b) => a.name.localeCompare(b.name)),
  });

  await writeFile(join(OUT_DIR, 'index.json'), `${JSON.stringify(index, null, 2)}\n`);

  console.log(
    `Built ${items.length} item(s) to ${resolve(OUT_DIR)}:`,
    items.map((i) => i.name).join(', ') || '(none)',
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
