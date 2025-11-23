import ora from 'ora';
import path from 'path';
import fs from 'fs/promises';
import { REPLState } from '../repl/state.js';
import { buildProjectMap } from '../core/mapper.js';
import { icons } from '../utils/icons.js';
import chalk from 'chalk';

export async function initCommand(state: REPLState, force: boolean = false) {
  try {
    // Find project root (look for package.json)
    const cwd = process.cwd();
    const packageJsonPath = path.join(cwd, 'package.json');

    try {
      await fs.access(packageJsonPath);
      state.projectRoot = cwd;
    } catch {
      console.log(chalk.red('No package.json found. Are you in a React project?'));
      return;
    }

    // Check for existing project map (unless --force)
    const reactgenDir = path.join(cwd, '.reactgen');
    const mapPath = path.join(reactgenDir, 'project-map.json');

    if (!force) {
      try {
        const existingMapContent = await fs.readFile(mapPath, 'utf-8');
        const existingMap = JSON.parse(existingMapContent);
        const scannedAt = new Date(existingMap.scannedAt);
        const ageInMinutes = (Date.now() - scannedAt.getTime()) / 60000;

        if (ageInMinutes < 5) {
          // Use cached map
          const ageText = ageInMinutes < 1
            ? 'less than a minute ago'
            : `${Math.floor(ageInMinutes)} minute${Math.floor(ageInMinutes) === 1 ? '' : 's'} ago`;

          console.log(chalk.cyan(`${icons.info} Using cached project map (scanned ${ageText})`));
          console.log(chalk.gray('Run /init --force to rescan\n'));

          await state.setProjectMap(existingMap);

          // Display summary
          if (state.projectName) {
            console.log(`${icons.checkmark} Project: ${state.projectName}`);
          }
          console.log(`${icons.checkmark} Found ${existingMap.files.length} React files`);
          console.log(`${icons.checkmark} Found ${existingMap.components.length} components`);
          return;
        }
      } catch {
        // No existing map or error reading it - proceed with scan
      }
    }

    const spinner = ora({
      text: 'Scanning project structure...',
      // Disable spinner in non-TTY environments and prevent stdin issues
      isEnabled: process.stdout.isTTY,
      discardStdin: false
    }).start();

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
    await fs.mkdir(reactgenDir, { recursive: true });
    await fs.writeFile(
      mapPath,
      JSON.stringify(projectMap, null, 2)
    );

    await state.setProjectMap(projectMap);

    spinner.succeed('Project scan complete');

    // Display summary
    console.log();
    if (state.projectName) {
      console.log(`${icons.checkmark} Project: ${state.projectName}`);
    }
    console.log(`${icons.checkmark} Found ${projectMap.files.length} React files`);
    console.log(`${icons.checkmark} Found ${projectMap.components.length} components`);
    console.log(`${icons.checkmark} Project map saved to .reactgen/project-map.json`);

  } catch (error: any) {
    console.error(chalk.red('Failed to scan project'));
    console.error(error.message);
  }
}
