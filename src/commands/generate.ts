import chalk from 'chalk';
import ora from 'ora';
import path from 'path';
import fs from 'fs/promises';
import inquirer from 'inquirer';
import { REPLState } from '../repl/state.js';
import { RequestParser } from '../core/llm/request-parser.js';
import { ComponentGenerator } from '../core/llm/generator.js';
import { icons } from '../utils/icons.js';

export async function generateCommand(
  state: REPLState,
  input: string
) {
  if (!state.ollamaClient.isInitialized()) {
    console.log(chalk.red(`${icons.cross} Ollama not initialized`));
    console.log(chalk.gray('Run: /llm init'));
    return;
  }

  // Parse the request
  const parser = new RequestParser();
  const parsed = parser.parse(input);

  if (!parser.isValid(parsed)) {
    console.log(chalk.yellow(`${icons.warning} ${parser.getHelpText(parsed)}`));
    console.log(chalk.gray('\nExample: make me a @login page with two @card components'));
    console.log(chalk.gray('Direct template: @form:login'));
    return;
  }

  // Display analysis
  console.log(chalk.cyan('Analyzing request...'));
  console.log(chalk.gray(`  Found ${parsed.components.length} component(s):`));

  for (const comp of parsed.components) {
    const countText = comp.count > 1 ? ` (x${comp.count})` : '';
    console.log(chalk.gray(`    ${comp.symbol} ${icons.arrow} @${comp.template}${countText}`));
  }
  console.log();

  // Generate each component
  const filesToCreate: Array<{ path: string; code: string }> = [];

  for (const comp of parsed.components) {
    for (let i = 0; i < comp.count; i++) {
      const componentName = generateComponentName(comp.template, i, comp.count);
      const outputPath = path.join(
        state.projectRoot || process.cwd(),
        'src/components',
        `${componentName}.tsx`
      );

      // Check if file exists
      try {
        await fs.access(outputPath);
        console.log(chalk.yellow(`${icons.warning} File exists: ${path.basename(outputPath)}`));
        continue;
      } catch {
        // File doesn't exist, proceed
      }

      // Generate code
      const spinner = ora(`Generating ${componentName}...`).start();

      try {
        const generator = new ComponentGenerator(state.ollamaClient);
        const code = await generator.generate({
          template: comp.template,
          componentName,
          customization: extractCustomizationText(parsed.description, comp.symbol),
          context: comp.context
        });

        filesToCreate.push({ path: outputPath, code });
        spinner.succeed(`Generated ${componentName}`);
      } catch (error: any) {
        spinner.fail(`Failed to generate ${componentName}`);
        console.error(chalk.red(error.message));
      }
    }
  }

  if (filesToCreate.length === 0) {
    console.log(chalk.gray('No files to create.'));
    return;
  }

  // Confirm file creation
  console.log();
  console.log(chalk.cyan(`Will create ${filesToCreate.length} file(s):`));
  for (const file of filesToCreate) {
    console.log(chalk.gray(`  - ${path.relative(process.cwd(), file.path)}`));
  }
  console.log();

  const { confirm } = await inquirer.prompt([{
    type: 'confirm',
    name: 'confirm',
    message: 'Create these files?',
    default: true
  }]);

  if (!confirm) {
    console.log(chalk.gray('Cancelled.'));
    return;
  }

  // Write files
  for (const file of filesToCreate) {
    await fs.mkdir(path.dirname(file.path), { recursive: true });
    await fs.writeFile(file.path, file.code, 'utf-8');

    const lines = file.code.split('\n').length;
    console.log(chalk.green(`${icons.checkmark} Created ${path.basename(file.path)} (${lines} lines)`));
  }
}

function generateComponentName(template: string, index: number, total: number): string {
  const [category, variant] = template.split(':');

  // Base name from variant or category
  let baseName = variant || category;
  baseName = baseName
    .split(/[-_]/)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join('');

  // Add number if multiple of same type
  if (total > 1) {
    return `${baseName}${index + 1}`;
  }

  return baseName;
}

function extractCustomizationText(description: string, symbol: string): string {
  // Remove all @symbols to get plain text
  let text = description.replace(/@[\w:]+/g, '');

  // Clean up extra spaces
  text = text.replace(/\s+/g, ' ').trim();

  return text;
}
