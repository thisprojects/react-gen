import readline from 'readline';
import chalk from 'chalk';
import { handleCommand } from './commands.js';
import { REPLState } from './state.js';

export async function startREPL() {
  const state = new REPLState();

  // Ensure stdin is in raw mode and not paused
  if (process.stdin.isTTY) {
    process.stdin.setRawMode(false);
  }
  process.stdin.resume();

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    prompt: chalk.blue('reactgen> '),
    terminal: process.stdout.isTTY
  });

  console.log('Initializing...');
  console.log('Ready.\n');

  rl.prompt();

  rl.on('line', async (input: string) => {
    const trimmed = input.trim();

    if (!trimmed) {
      rl.prompt();
      return;
    }

    try {
      const shouldContinue = await handleCommand(trimmed, state);

      if (!shouldContinue) {
        rl.close();
        return;
      }
    } catch (error: any) {
      console.error(chalk.red('Error:'), error.message);
    }

    console.log(); // Empty line for spacing
    rl.prompt();
  });

  rl.on('close', () => {
    console.log('\nGoodbye!');
    process.exit(0);
  });

  // Handle Ctrl+C gracefully
  rl.on('SIGINT', () => {
    console.log('\n\nUse /exit to quit');
    rl.prompt();
  });
}
