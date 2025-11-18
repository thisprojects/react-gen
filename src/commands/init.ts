import ora from 'ora';
import path from 'path';
import fs from 'fs/promises';
import { REPLState } from '../repl/state.js';
import { buildProjectMap } from '../core/mapper.js';

export async function initCommand(state: REPLState) {
  const spinner = ora({
    text: 'Scanning project structure...',
    // Disable spinner in non-TTY environments and prevent stdin issues
    isEnabled: process.stdout.isTTY,
    discardStdin: false
  }).start();

  try {
    // Find project root (look for package.json)
    const cwd = process.cwd();
    const packageJsonPath = path.join(cwd, 'package.json');

    try {
      await fs.access(packageJsonPath);
      state.projectRoot = cwd;
    } catch {
      spinner.fail('No package.json found. Are you in a React project?');
      return;
    }

    spinner.text = 'Analyzing files...';

    // Build project map
    const projectMap = await buildProjectMap(cwd);

    if (projectMap.files.length === 0) {
      spinner.warn('No React files found in this project.');
      console.log('\nMake sure you have .tsx or .jsx files in:');
      console.log('  - src/');
      console.log('  - components/');
      console.log('  - app/');
      return;
    }

    // Save to .reactgen/project-map.json
    const reactgenDir = path.join(cwd, '.reactgen');
    await fs.mkdir(reactgenDir, { recursive: true });
    await fs.writeFile(
      path.join(reactgenDir, 'project-map.json'),
      JSON.stringify(projectMap, null, 2)
    );

    state.setProjectMap(projectMap);

    spinner.succeed('Project scan complete');

    // Display summary
    console.log();
    console.log(`✓ Found ${projectMap.files.length} React files`);
    console.log(`✓ Found ${projectMap.components.length} components`);
    console.log(`✓ Project map saved to .reactgen/project-map.json`);

  } catch (error: any) {
    spinner.fail('Failed to scan project');
    console.error(error.message);
  }
}
