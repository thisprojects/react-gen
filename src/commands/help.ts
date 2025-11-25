import chalk from 'chalk';
import boxen from 'boxen';

export function helpCommand() {
  const helpText = `
${chalk.bold('Available Commands:')}

${chalk.bold.cyan('LLM & Generation:')}
${chalk.blue('/llm init')}       Initialize Ollama connection
${chalk.blue('/llm status')}     Check Ollama status
${chalk.blue('/llm models')}     Show available models

${chalk.bold.cyan('Component Generation:')}
  Use @ to specify components in natural language:

  ${chalk.cyan('make me a @login page')}
  ${chalk.cyan('create a @signup form with validation')}
  ${chalk.cyan('build a @card grid with three @card components')}
  ${chalk.cyan('@form:login')}  ${chalk.gray('(direct template reference)')}

${chalk.bold.cyan('Available @Components:')}
  @login, @signup, @contact    ${chalk.gray('(forms)')}
  @button                      ${chalk.gray('(buttons)')}
  @card                        ${chalk.gray('(cards)')}
  @modal, @dialog              ${chalk.gray('(modals)')}

${chalk.bold.cyan('Project Commands:')}
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

${chalk.bold.cyan('Setup (One-time):')}
1. Install Ollama: ${chalk.cyan('https://ollama.com')}
2. Download model: ${chalk.cyan('ollama pull qwen2.5-coder:14b')}
3. Start Ollama: ${chalk.cyan('ollama serve')}
4. In ReactGen: ${chalk.cyan('/llm init')}

${chalk.gray('Then generate components with @references!')}
`;

  console.log(boxen(helpText, {
    padding: 1,
    borderColor: 'blue',
    borderStyle: 'round'
  }));
}
