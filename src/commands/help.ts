import chalk from 'chalk';
import boxen from 'boxen';

export function helpCommand() {
  const helpText = `
${chalk.bold('Available Commands:')}

${chalk.blue('/init [--force]')} Scan project and build component map
                  Uses cached map if < 5 minutes old
                  ${chalk.gray('--force')} or ${chalk.gray('-f')} to force rescan

${chalk.blue('/list [filter]')}  Show available files and components
                  Examples:
                    /list           (show all files)
                    /list form      (filter by "form")
                    /list test      (show test files)

${chalk.blue('/info <file>')}    Show detailed information about a file
                  Example: /info Button.tsx

${chalk.blue('/test <ref>')}     Test reference resolution (Phase 2)
                  Examples:
                    /test #Button           (file reference)
                    /test .components#Form  (folder + file)
                    /test @form:login       (template)

${chalk.blue('/help')}           Show this help message
${chalk.blue('/clear')}          Clear the screen
${chalk.blue('/exit')}           Exit ReactGen

${chalk.gray('Tip: Use TAB completion for #files, .folders, and @templates!')}
`;

  console.log(boxen(helpText, {
    padding: 1,
    borderColor: 'blue',
    borderStyle: 'round'
  }));
}
