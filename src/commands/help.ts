import chalk from 'chalk';
import boxen from 'boxen';

export function helpCommand() {
  const helpText = `
${chalk.bold('Available Commands:')}

${chalk.blue('/init')}           Scan project and build component map
${chalk.blue('/list [filter]')}  Show available files and components
                  Examples:
                    /list           (show all files)
                    /list form      (filter by "form")
                    /list test      (show test files)

${chalk.blue('/info <file>')}    Show detailed information about a file
                  Example: /info Button.tsx

${chalk.blue('/help')}           Show this help message
${chalk.blue('/clear')}          Clear the screen
${chalk.blue('/exit')}           Exit ReactGen

${chalk.gray('Tip: Start with /init to scan your project!')}
`;

  console.log(boxen(helpText, {
    padding: 1,
    borderColor: 'blue',
    borderStyle: 'round'
  }));
}
