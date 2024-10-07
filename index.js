#!/usr/bin/env node
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';

import { conflictResolvers } from './conflict-resolvers.js';
import mergeDirectories from './index.js';

const argv = yargs(hideBin(process.argv))
  .usage('Usage: $0 <source> <destination> [options]')
  .command('$0 <source> <destination>', 'Merge two directories', (yargs) => {
    yargs
      .positional('source', {
        demandOption: true,
        describe: 'Source directory',
        type: 'string',
      })
      .positional('destination', {
        demandOption: true,
        describe: 'Destination directory',
        type: 'string',
      });
  })
  .option('conflict', {
    alias: 'c',
    choices: ['skip', 'overwrite', 'ask'],
    default: 'skip',
    describe: 'Conflict resolution strategy: skip, overwrite, or ask',
    type: 'string',
  })
  .help()
  .alias('help', 'h')
  .argv;

let resolver;
if (argv.conflict === 'overwrite') {
  resolver = conflictResolvers.overwrite;
} else if (argv.conflict === 'ask') {
  resolver = conflictResolvers.ask;
} else { // default to 'skip'
  resolver = conflictResolvers.skip;
}

mergeDirectories(argv.source, argv.destination, resolver);
