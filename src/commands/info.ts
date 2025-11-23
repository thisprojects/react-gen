import chalk from 'chalk';
import { REPLState } from '../repl/state.js';
import { ProjectMap } from '../core/mapper.js';
import { AutoCompleter } from '../core/autocomplete.js';
import { icons } from '../utils/icons.js';

export async function infoCommand(state: REPLState, filename: string) {
  const projectMap = state.projectMap;

  if (!projectMap) {
    console.log('Project not initialized');
    return;
  }

  let searchFilename = filename;

  // Check if it's a reference (#file, .folder#file)
  if (filename.startsWith('#') || filename.includes('.') && filename.includes('#')) {
    const autocompleter = new AutoCompleter(state);
    const resolved = autocompleter.resolveReference(filename);

    if (resolved) {
      // Extract just the filename from the resolved path
      searchFilename = resolved.split('/').pop()?.replace(/\.(tsx?|jsx?)$/, '') || filename;
    } else {
      console.log(chalk.red(`${icons.cross} Could not resolve reference: ${filename}`));
      console.log(chalk.gray('Tip: Use TAB completion to see available references'));
      return;
    }
  }

  // Find file in project map
  const file = findFileInMap(projectMap, searchFilename);

  if (!file) {
    console.log(`File not found: ${filename}`);
    console.log('Try /list to see available files');
    return;
  }

  // Display file information
  console.log(chalk.bold(`File: ${file.path}`));
  console.log(chalk.gray('─'.repeat(60)));
  console.log(`Lines: ${file.lines}`);
  console.log(`Type: ${file.type}`);

  if (file.exports && file.exports.length > 0) {
    console.log(`Exports: ${file.exports.join(', ')}`);
  }

  if (file.imports && file.imports.length > 0) {
    console.log(`\nImports:`);
    file.imports.forEach((imp: string) => console.log(`  - ${imp}`));
  }

  if (file.usedBy && file.usedBy.length > 0) {
    console.log(`\nUsed by (${file.usedBy.length}):`);
    file.usedBy.forEach((user: string) => console.log(`  - ${user}`));
  }
}

function findFileInMap(projectMap: ProjectMap, filename: string): any {
  // Search through project map structure
  // Handle partial matches (e.g., "Button" should match "Button.tsx")

  function searchStructure(obj: any, target: string): any {
    for (const key in obj) {
      if (typeof obj[key] === 'object') {
        if ('path' in obj[key]) {
          // This is a file entry
          const filePath = obj[key].path;
          const fileName = filePath.split('/').pop();

          // Match full name or name without extension
          if (fileName === target ||
              fileName.replace(/\.(tsx?|jsx?)$/, '') === target.replace(/\.(tsx?|jsx?)$/, '')) {
            return obj[key];
          }
        } else {
          // This is a directory, recurse
          const found = searchStructure(obj[key], target);
          if (found) return found;
        }
      }
    }
    return null;
  }

  return searchStructure(projectMap.structure, filename);
}
