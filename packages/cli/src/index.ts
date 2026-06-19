import { Command } from 'commander';
import { red } from 'kleur/colors';
import { add } from './commands/add.js';
import { list } from './commands/list.js';

const program = new Command();

program
  .name('pkg-boilerplate')
  .description('Add registry items into your project (no backend required).')
  .version('0.0.0');

program
  .command('add')
  .description('Add one or more items (with their dependencies) to your project.')
  .argument('<items...>', 'item name(s) to add')
  .option('-r, --registry <url>', 'registry base URL')
  .option('-c, --cwd <path>', 'working directory', process.cwd())
  .option('-o, --overwrite', 'overwrite existing files', false)
  .action(async (items: string[], options) => {
    await add(items, options);
  });

program
  .command('list')
  .alias('ls')
  .description('List every item available in the registry.')
  .option('-r, --registry <url>', 'registry base URL')
  .action(async (options) => {
    await list(options);
  });

program.parseAsync().catch((error: unknown) => {
  console.error(red(error instanceof Error ? error.message : String(error)));
  process.exit(1);
});
