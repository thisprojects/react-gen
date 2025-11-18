import chalk from 'chalk';
import boxen from 'boxen';

export function displayWelcome() {
  const welcome = boxen(
    chalk.bold('ReactGen v1.0') + '\n' +
    'React Component Assistant\n' +
    'Interactive REPL Mode\n\n' +
    chalk.gray('Type /help for available commands'),
    {
      padding: 1,
      margin: 1,
      borderColor: 'blue',
      borderStyle: 'round'
    }
  );

  console.log(welcome);
}

export function displayError(message: string) {
  console.log(chalk.red('✗'), message);
}

export function displaySuccess(message: string) {
  console.log(chalk.green('✓'), message);
}

export function displayInfo(message: string) {
  console.log(chalk.blue('ℹ'), message);
}

export function displayWarning(message: string) {
  console.log(chalk.yellow('⚠'), message);
}
