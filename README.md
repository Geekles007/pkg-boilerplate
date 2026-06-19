# pkg-boilerplate

Boilerplate for **shadcn-style, registry-as-code packages** — distribute code by
copying files into a consumer's project, not by shipping a runtime dependency.
**No database, no backend.** The "registry" is just static JSON served from
GitHub Pages (or any static host), and a CLI copies items into the user's repo.

Use it as the starting point for component registries, MDX/snippet libraries,
config presets, anything you'd `add` rather than `install`.

## What's inside

```
packages/core      Headless schema (zod) + registry fetch/resolve helpers
packages/cli       `add` / `list` commands — copies items into a project
registry/          Source items + build script -> static JSON in public/r/
apps/www           Next.js docs site (static export); also serves /r
scripts/rename.mjs One-shot rebrand for a new project
.github/workflows  CI + GitHub Pages deploy (site + registry)
```

Stack: **pnpm** workspaces · **Turborepo** · **TypeScript** · **tsup** ·
**Vitest** · **Biome** · **Changesets**.

## Quick start

```bash
pnpm install
pnpm registry:build   # compile registry/items -> registry/public/r
pnpm build            # build every package + the docs site
pnpm test             # run unit tests
pnpm check            # lint + format with Biome
```

Try the CLI against the local registry without publishing:

```bash
pnpm --filter @pkg-boilerplate/cli build
node packages/cli/dist/index.js list  --registry "file://$(pwd)/registry/public"
# (the default registry URL is GitHub Pages; --registry overrides it)
```

## How the registry works

Each item lives in `registry/items/<name>/`:

```
registry/items/example/
  meta.json          name, type, description, dependencies, file map
  files/example.ts   the source copied into the consumer's project
```

`pnpm registry:build` validates every item against the schema in
`@pkg-boilerplate/core` and emits:

- `registry/public/r/index.json` — list of all items
- `registry/public/r/<name>.json` — one resolved item each

Deploy `registry/public/` (and the docs site) to a static host. The CLI then
fetches `<registry-url>/r/<name>.json`, resolves `registryDependencies`, and
writes the files into the user's project.

## Reuse for a new project

```bash
# 1. scaffold from this boilerplate
gh repo create <name> --public --template Geekles007/pkg-boilerplate --clone
cd <name>

# 2. rebrand scope + Pages URL in one shot
node scripts/rename.mjs --scope <name> --owner <owner> --repo <name>

# 3. go
pnpm install && pnpm build
```

`rename.mjs` swaps every `@pkg-boilerplate/*` scope and the GitHub Pages URL.
Add `--dry` to preview.

## Deploy

The `Deploy site + registry` workflow builds the registry, statically exports
the docs site (with `BASE_PATH` set for project pages), and publishes to GitHub
Pages. Enable Pages → "GitHub Actions" in the repo settings once.

## License

[MIT](./LICENSE) © Geekles007
