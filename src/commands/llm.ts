import chalk from 'chalk';
import { OllamaClient } from '../core/llm/ollama-client.js';
import { icons } from '../utils/icons.js';

export async function llmCommand(
  ollamaClient: OllamaClient,
  subcommand?: string
) {
  if (!subcommand || subcommand === 'status') {
    const status = await ollamaClient.checkStatus();

    if (!status.connected) {
      console.log(chalk.red(`${icons.cross} Cannot connect to Ollama`));
      console.log(chalk.gray('\nIs Ollama running?'));
      console.log(chalk.cyan('  Start with: ollama serve'));
      return;
    }

    if (!status.available) {
      console.log(chalk.yellow(`${icons.warning} Model not available: ${status.model}`));
      console.log(chalk.gray('\nDownload model:'));
      console.log(chalk.cyan(`  ollama pull ${status.model}`));
      return;
    }

    if (ollamaClient.isInitialized()) {
      console.log(chalk.green(`${icons.checkmark} Ollama ready`));
      console.log(chalk.gray(`  Model: ${status.model}`));
      console.log(chalk.gray('  You can now generate components!'));
    } else {
      console.log(chalk.yellow(`${icons.warning} Ollama connected but not initialized`));
      console.log(chalk.gray('Run: /llm init'));
    }
    return;
  }

  switch (subcommand.toLowerCase()) {
    case 'init':
      if (ollamaClient.isInitialized()) {
        console.log(chalk.cyan(`${icons.info} Already initialized`));
        return;
      }

      console.log('Checking Ollama connection...');

      try {
        await ollamaClient.initialize();
        console.log(chalk.green(`\n${icons.checkmark} Ollama initialized successfully`));
        console.log(chalk.gray('You can now generate components with natural language!'));
        console.log(chalk.gray('\nExample: make me a @login form with validation'));
      } catch (error: any) {
        console.log(chalk.red(`\n${icons.cross} Initialization failed`));
        console.error(error.message);
      }
      break;

    case 'models':
      console.log('Fetching available models...');
      try {
        const status = await ollamaClient.checkStatus();
        if (!status.connected) {
          console.log(chalk.red('Cannot connect to Ollama'));
          return;
        }

        console.log(chalk.green(`${icons.checkmark} Connected to Ollama`));
        console.log(chalk.gray(`\nCurrent model: ${status.model}`));
        console.log(chalk.gray('Run "ollama list" in terminal to see all models'));
      } catch (error: any) {
        console.error(chalk.red(error.message));
      }
      break;

    default:
      console.log(`Unknown subcommand: ${subcommand}`);
      console.log('\nAvailable commands:');
      console.log('  /llm init    - Initialize Ollama connection');
      console.log('  /llm status  - Check Ollama status');
      console.log('  /llm models  - Show available models');
  }
}
