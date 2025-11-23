import readline from 'readline';
import chalk from 'chalk';
import { handleCommand } from './commands.js';
import { REPLState } from './state.js';
import { AutoCompleter } from '../core/autocomplete.js';

export async function startREPL() {
  const state = new REPLState();
  const autocompleter = new AutoCompleter(state);

  // Ensure stdin is in raw mode and not paused
  if (process.stdin.isTTY) {
    process.stdin.setRawMode(false);
  }
  process.stdin.resume();

  // Set up autocomplete function for readline
  const completer = (line: string): [string[], string] => {
    // Find the token being completed
    const templateMatch = line.match(/@([a-zA-Z0-9:-]*)$/);
    const fileMatch = line.match(/#([a-zA-Z0-9_-]*)$/);
    const folderMatch = line.match(/\.([a-zA-Z0-9._/-]*)$/);

    let token = '';
    if (templateMatch) {
      token = templateMatch[0]; // Include @ prefix
    } else if (fileMatch) {
      token = fileMatch[0]; // Include # prefix
    } else if (folderMatch) {
      token = folderMatch[0]; // Include . prefix
    }

    if (token) {
      const completions = autocompleter.complete(line, line.length);

      // Debug logging (remove in production)
      if (process.env.DEBUG_COMPLETION) {
        console.error(`\n[DEBUG] Line: "${line}"`);
        console.error(`[DEBUG] Token: "${token}"`);
        console.error(`[DEBUG] Completions:`, completions);
        console.error(`[DEBUG] State initialized: ${state.isInitialized}`);
        console.error(`[DEBUG] Files in map: ${state.projectMap?.files.length || 0}`);
      }

      return [completions, token];
    }

    return [[], ''];
  };

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    prompt: chalk.blue('reactgen> '),
    terminal: process.stdout.isTTY,
    completer
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
