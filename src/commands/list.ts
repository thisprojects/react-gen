import chalk from 'chalk';
import { REPLState } from '../repl/state.js';
import { icons } from '../utils/icons.js';

export async function listCommand(state: REPLState, filter?: string) {
  const files = state.getFiles();

  if (files.length === 0) {
    console.log('No files found. Run /init to scan project.');
    return;
  }

  // Apply filter if provided
  let filteredFiles = files;
  if (filter) {
    filteredFiles = files.filter(f =>
      f.toLowerCase().includes(filter.toLowerCase())
    );
  }

  if (filteredFiles.length === 0) {
    console.log(`No files matching "${filter}"`);
    return;
  }

  // Group by directory
  const grouped: Record<string, string[]> = {};

  for (const file of filteredFiles) {
    const dir = file.split('/').slice(0, -1).join('/') || '.';
    if (!grouped[dir]) {
      grouped[dir] = [];
    }
    grouped[dir].push(file.split('/').pop()!);
  }

  // Display grouped results
  console.log(chalk.bold(`Files (${filteredFiles.length}):`));
  console.log();

  for (const [dir, files] of Object.entries(grouped)) {
    console.log(chalk.blue(`${icons.folder} ${dir}/`));
    for (const file of files) {
      const icon = file.includes('.test.') || file.includes('.spec.')
        ? icons.test
        : icons.file;
      console.log(`  ${icon} ${file}`);
    }
    console.log();
  }
}
