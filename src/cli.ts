#!/usr/bin/env node

import { Command } from 'commander';
import { startREPL } from './repl/repl.js';
import { displayWelcome } from './utils/display.js';

const program = new Command();

program
  .name('reactgen')
  .description('Interactive React component assistant')
  .version('1.0.0')
  .action(async () => {
    // Launch directly into REPL mode
    displayWelcome();
    await startREPL();
  });

program.parse();
