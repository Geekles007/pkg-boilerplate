import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { type RegistryIndex, registryIndexSchema } from '@pkg-boilerplate/core';

/**
 * Reads the compiled registry index at build time. `copy-registry.mjs` places
 * it in public/r before `next build`, so this works for the static export.
 */
async function loadIndex(): Promise<RegistryIndex | null> {
  try {
    const file = join(process.cwd(), 'public', 'r', 'index.json');
    return registryIndexSchema.parse(JSON.parse(await readFile(file, 'utf8')));
  } catch {
    return null;
  }
}

export default async function Home() {
  const index = await loadIndex();

  return (
    <main className="wrap">
      <h1>{index?.name ?? 'pkg-boilerplate'}</h1>
      <p className="tagline">
        A shadcn-style, registry-as-code package. No database, no backend — just static JSON and a
        CLI that copies files into your project.
      </p>

      <h2>Install an item</h2>
      <pre>
        <code>npx pkg-boilerplate add example</code>
      </pre>

      <h2>Available items</h2>
      {index && index.items.length > 0 ? (
        <ul className="items">
          {index.items.map((item) => (
            <li key={item.name} className="item">
              <div className="item-name">{item.name}</div>
              {item.description ? <p className="item-desc">{item.description}</p> : null}
            </li>
          ))}
        </ul>
      ) : (
        <p className="empty">
          No items yet. Run <code>pnpm registry:build</code>, then reload.
        </p>
      )}
    </main>
  );
}
