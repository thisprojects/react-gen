import chalk from 'chalk';
import { REPLState } from './state.js';
import { initCommand } from '../commands/init.js';
import { listCommand } from '../commands/list.js';
import { infoCommand } from '../commands/info.js';
import { helpCommand } from '../commands/help.js';
import { clearCommand } from '../commands/clear.js';
import { testCommand } from '../commands/test.js';
import { llmCommand } from '../commands/llm.js';
import { generateCommand } from '../commands/generate.js';

export async function handleCommand(
  input: string,
  state: REPLState
): Promise<boolean> {

  // Commands start with /
  if (!input.startsWith('/')) {
    // If Ollama is ready, treat as generation request
    if (state.ollamaClient.isInitialized()) {
      // Check if input has @references
      if (input.includes('@')) {
        await generateCommand(state, input);
        return true;
      }

      console.log(chalk.yellow('Use @ to specify components'));
      console.log(chalk.gray('Example: make me a @login page'));
      console.log(chalk.gray('Or use commands starting with /'));
      return true;
    }

    console.log('Commands must start with /');
    console.log('Type /help for available commands');
    console.log(chalk.gray('Tip: Run /llm init to enable component generation'));
    return true;
  }

  const [command, ...args] = input.slice(1).split(/\s+/);

  switch (command.toLowerCase()) {
    case 'llm':
      await llmCommand(state.ollamaClient, args[0]);
      break;

    case 'generate':
    case 'gen':
      if (!state.ollamaClient.isInitialized()) {
        console.log(chalk.yellow('Ollama not initialized. Run /llm init first.'));
        break;
      }
      await generateCommand(state, args.join(' '));
      break;

    case 'init':
      const force = args.includes('--force') || args.includes('-f');
      await initCommand(state, force);
      break;

    case 'list':
      if (state.requiresInit()) {
        console.log('⚠️  Project not initialized. Run /init first.');
        break;
      }
      await listCommand(state, args[0]);
      break;

    case 'info':
      if (state.requiresInit()) {
        console.log('⚠️  Project not initialized. Run /init first.');
        break;
      }
      if (!args[0]) {
        console.log('Usage: /info <filename>');
        break;
      }
      await infoCommand(state, args[0]);
      break;

    case 'test':
      if (state.requiresInit()) {
        console.log('⚠️  Project not initialized. Run /init first.');
        break;
      }
      testCommand(state, args[0]);
      break;

    case 'help':
      helpCommand();
      break;

    case 'clear':
      clearCommand();
      break;

    case 'exit':
    case 'quit':
      return false; // Signal to exit REPL

    default:
      console.log(`Unknown command: /${command}`);
      console.log('Type /help for available commands');
  }

  return true; // Continue REPL
}
