import chalk from 'chalk';
import { REPLState } from '../repl/state.js';
import { AutoCompleter } from '../core/autocomplete.js';
import { icons } from '../utils/icons.js';

/**
 * Test command for reference resolution
 * Usage:
 *   /test #Button
 *   /test .components.forms#LoginForm
 *   /test @form:login
 */
export function testCommand(state: REPLState, reference: string) {
  if (!reference) {
    console.log(chalk.yellow('Usage: /test <reference>'));
    console.log('\nExamples:');
    console.log('  /test #Button               ' + chalk.gray('Test file reference'));
    console.log('  /test .components#Header    ' + chalk.gray('Test folder + file reference'));
    console.log('  /test @form:login           ' + chalk.gray('Test template reference'));
    return;
  }

  // Handle template references
  if (reference.startsWith('@')) {
    const templateName = reference.slice(1);
    console.log(chalk.cyan(`${icons.info} Template Reference: ${reference}`));
    console.log(chalk.gray('Template references are used for generating new components.'));
    console.log(chalk.gray('In Phase 3, this will trigger component generation.'));
    return;
  }

  // Handle file references
  const autocompleter = new AutoCompleter(state);
  const resolvedPath = autocompleter.resolveReference(reference);

  if (resolvedPath) {
    console.log(chalk.green(`${icons.checkmark} Reference resolved successfully!`));
    console.log(`${chalk.cyan('Reference:')} ${reference}`);
    console.log(`${chalk.cyan('File Path:')} ${resolvedPath}`);

    // Show file info if available
    if (state.projectMap) {
      const fileStructure = findFileInStructure(state.projectMap.structure, resolvedPath);
      if (fileStructure) {
        console.log(`${chalk.cyan('Type:')} ${fileStructure.type}`);
        console.log(`${chalk.cyan('Lines:')} ${fileStructure.lines}`);
        if (fileStructure.exports.length > 0) {
          console.log(`${chalk.cyan('Exports:')} ${fileStructure.exports.join(', ')}`);
        }
      }
    }
  } else {
    console.log(chalk.red(`${icons.cross} Could not resolve reference: ${reference}`));
    console.log(chalk.gray('\nTip: Use TAB completion to explore available references.'));
  }
}

/**
 * Helper function to find file metadata in project structure
 */
function findFileInStructure(structure: any, targetPath: string): any {
  for (const key in structure) {
    const item = structure[key];

    if (item && typeof item === 'object') {
      // Check if this is the file we're looking for
      if (item.path === targetPath) {
        return item;
      }

      // Recursively search nested structures
      if (!item.path) {
        const found = findFileInStructure(item, targetPath);
        if (found) return found;
      }
    }
  }

  return null;
}
