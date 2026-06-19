/**
 * Rebrands the boilerplate for a new project in one shot:
 *
 *   node scripts/rename.mjs --scope mdkit --owner Geekles007 --repo mdkit
 *
 *   --scope  new package scope, replaces `pkg-boilerplate`
 *            (e.g. `mdkit` -> packages become @mdkit/core, @mdkit/cli, ...)
 *   --owner  GitHub owner/org for the Pages URL (default: Geekles007)
 *   --repo   GitHub repo name, used for the Pages base path (default: <scope>)
 *
 * Pass --dry to preview without writing.
 */
import { readFile, readdir, stat, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const IGNORE = new Set([
  'node_modules',
  '.git',
  '.turbo',
  '.next',
  'dist',
  'out',
  'coverage',
  'public',
]);
const TEXT_EXT = new Set(['.ts', '.tsx', '.js', '.mjs', '.json', '.md', '.yml', '.yaml', '.css']);

function parseArgs(argv) {
  const args = { owner: 'Geekles007', dry: false };
  for (let i = 0; i < argv.length; i += 1) {
    const key = argv[i];
    if (key === '--dry') args.dry = true;
    else if (key === '--scope') args.scope = argv[++i];
    else if (key === '--owner') args.owner = argv[++i];
    else if (key === '--repo') args.repo = argv[++i];
  }
  if (!args.scope) {
    console.error('Missing --scope. Example: node scripts/rename.mjs --scope mdkit');
    process.exit(1);
  }
  args.repo ??= args.scope;
  return args;
}

async function* walk(dir) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    if (IGNORE.has(entry.name)) continue;
    const full = join(dir, entry.name);
    if (entry.isDirectory()) yield* walk(full);
    else yield full;
  }
}

function hasTextExt(path) {
  const dot = path.lastIndexOf('.');
  return dot !== -1 && TEXT_EXT.has(path.slice(dot));
}

async function main() {
  const { scope, owner, repo, dry } = parseArgs(process.argv.slice(2));
  const newPagesUrl = `https://${owner}.github.io/${repo}`;

  const replacements = [
    [/@pkg-boilerplate/g, `@${scope}`],
    [/Geekles007\.github\.io\/pkg-boilerplate/g, `${owner}.github.io/${repo}`],
    [/pkg-boilerplate/g, scope],
  ];

  let changed = 0;
  for await (const file of walk(ROOT)) {
    if (!hasTextExt(file)) continue;
    if ((await stat(file)).size > 512 * 1024) continue;
    const before = await readFile(file, 'utf8');
    let after = before;
    for (const [pattern, value] of replacements) after = after.replace(pattern, value);
    if (after !== before) {
      changed += 1;
      if (!dry) await writeFile(file, after);
      console.log(`${dry ? '[dry] ' : ''}updated ${file.replace(`${ROOT}/`, '')}`);
    }
  }

  const verb = dry ? '[dry] would update' : 'Updated';
  console.log(
    `\n${verb} ${changed} file(s).\nScope:  @${scope}\nPages:  ${newPagesUrl}\n\nNext: pnpm install && pnpm build`,
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
