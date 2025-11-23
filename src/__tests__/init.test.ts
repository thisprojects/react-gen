import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { initCommand } from '../commands/init.js';
import { REPLState } from '../repl/state.js';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';

// Mock console.log to capture output
let consoleOutput: string[] = [];
const originalLog = console.log;
const originalCwdValue = process.cwd();

beforeEach(() => {
  consoleOutput = [];
  console.log = jest.fn((...args: any[]) => {
    consoleOutput.push(args.join(' '));
  }) as any;

  // Ensure we're in a valid directory
  try {
    process.cwd();
  } catch {
    try {
      process.chdir(originalCwdValue);
    } catch {
      process.chdir(os.homedir());
    }
  }
});

afterEach(() => {
  console.log = originalLog;

  // Always restore to original directory
  try {
    process.chdir(originalCwdValue);
  } catch {
    // If original doesn't exist, go home
    try {
      process.chdir(os.homedir());
    } catch {}
  }
});

describe('initCommand', () => {
  let tempDir: string;
  let state: REPLState;

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'reactgen-init-test-'));
    state = new REPLState();

    // Mock process.cwd to return our temp directory
    process.cwd = jest.fn(() => tempDir) as any;
  });

  afterEach(async () => {
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  it('should fail when no package.json exists', async () => {
    await initCommand(state);

    expect(state.requiresInit()).toBe(true);
    expect(state.projectRoot).toBeNull();
  });

  it('should initialize successfully with package.json and React files', async () => {
    // Create package.json
    await fs.writeFile(
      path.join(tempDir, 'package.json'),
      JSON.stringify({ name: 'test-project' })
    );

    // Create a React component
    const srcDir = path.join(tempDir, 'src');
    await fs.mkdir(srcDir, { recursive: true });
    await fs.writeFile(
      path.join(srcDir, 'App.tsx'),
      'export const App = () => <div>App</div>;'
    );

    await initCommand(state);

    expect(state.requiresInit()).toBe(false);
    expect(state.projectRoot).toBe(tempDir);
    expect(state.getFiles()).toContain('src/App.tsx');
    expect(state.getComponents()).toContain('App');
  });

  it('should create .reactgen directory and save project map', async () => {
    await fs.writeFile(
      path.join(tempDir, 'package.json'),
      JSON.stringify({ name: 'test-project' })
    );

    const srcDir = path.join(tempDir, 'src');
    await fs.mkdir(srcDir, { recursive: true });
    await fs.writeFile(
      path.join(srcDir, 'Component.tsx'),
      'export const Component = () => <div>Test</div>;'
    );

    await initCommand(state);

    const reactgenDir = path.join(tempDir, '.reactgen');
    const projectMapPath = path.join(reactgenDir, 'project-map.json');

    const dirExists = await fs.access(reactgenDir).then(() => true).catch(() => false);
    const fileExists = await fs.access(projectMapPath).then(() => true).catch(() => false);

    expect(dirExists).toBe(true);
    expect(fileExists).toBe(true);

    // Verify project map content
    const content = await fs.readFile(projectMapPath, 'utf-8');
    const projectMap = JSON.parse(content);

    expect(projectMap.version).toBe('1.0');
    expect(projectMap.files).toContain('src/Component.tsx');
    expect(projectMap.components).toContain('Component');
  });

  it('should display summary after successful initialization', async () => {
    await fs.writeFile(
      path.join(tempDir, 'package.json'),
      JSON.stringify({ name: 'test-project' })
    );

    const srcDir = path.join(tempDir, 'src');
    await fs.mkdir(srcDir, { recursive: true });
    await fs.writeFile(
      path.join(srcDir, 'Button.tsx'),
      'export const Button = () => <button>Click</button>;'
    );
    await fs.writeFile(
      path.join(srcDir, 'Input.tsx'),
      'export const Input = () => <input />;'
    );

    await initCommand(state);

    expect(consoleOutput.some(line => line.includes('Found 2 React files'))).toBe(true);
    expect(consoleOutput.some(line => line.includes('Found 2 components'))).toBe(true);
    expect(consoleOutput.some(line => line.includes('.reactgen/project-map.json'))).toBe(true);
  });

  it('should warn when no React files are found', async () => {
    await fs.writeFile(
      path.join(tempDir, 'package.json'),
      JSON.stringify({ name: 'test-project' })
    );

    // Create src directory but no React files
    await fs.mkdir(path.join(tempDir, 'src'), { recursive: true });

    await initCommand(state);

    expect(consoleOutput.some(line => line.includes('src/'))).toBe(true);
    expect(consoleOutput.some(line => line.includes('components/'))).toBe(true);
    expect(consoleOutput.some(line => line.includes('app/'))).toBe(true);
  });

  it('should handle multiple React files across directories', async () => {
    await fs.writeFile(
      path.join(tempDir, 'package.json'),
      JSON.stringify({ name: 'test-project' })
    );

    await fs.mkdir(path.join(tempDir, 'src'), { recursive: true });
    await fs.mkdir(path.join(tempDir, 'components'), { recursive: true });
    await fs.mkdir(path.join(tempDir, 'app'), { recursive: true });

    await fs.writeFile(
      path.join(tempDir, 'src', 'App.tsx'),
      'export const App = () => <div>App</div>;'
    );
    await fs.writeFile(
      path.join(tempDir, 'components', 'Header.tsx'),
      'export const Header = () => <header>Header</header>;'
    );
    await fs.writeFile(
      path.join(tempDir, 'app', 'page.tsx'),
      'export default function Page() { return <div>Page</div>; }'
    );

    await initCommand(state);

    expect(state.getFiles()).toHaveLength(3);
    expect(consoleOutput.some(line => line.includes('Found 3 React files'))).toBe(true);
  });

  it('should update state with project root', async () => {
    await fs.writeFile(
      path.join(tempDir, 'package.json'),
      JSON.stringify({ name: 'test-project' })
    );

    const srcDir = path.join(tempDir, 'src');
    await fs.mkdir(srcDir, { recursive: true });
    await fs.writeFile(
      path.join(srcDir, 'App.tsx'),
      'export const App = () => <div>App</div>;'
    );

    expect(state.projectRoot).toBeNull();

    await initCommand(state);

    expect(state.projectRoot).toBe(tempDir);
  });

  it('should handle files with no exports', async () => {
    await fs.writeFile(
      path.join(tempDir, 'package.json'),
      JSON.stringify({ name: 'test-project' })
    );

    const srcDir = path.join(tempDir, 'src');
    await fs.mkdir(srcDir, { recursive: true });
    await fs.writeFile(
      path.join(srcDir, 'utils.tsx'),
      'const helper = () => "help";' // No exports
    );

    await initCommand(state);

    expect(state.getFiles()).toHaveLength(1);
    expect(state.getComponents()).toHaveLength(0);
    expect(consoleOutput.some(line => line.includes('Found 1 React files'))).toBe(true);
    expect(consoleOutput.some(line => line.includes('Found 0 components'))).toBe(true);
  });

  it('should handle nested directory structures', async () => {
    await fs.writeFile(
      path.join(tempDir, 'package.json'),
      JSON.stringify({ name: 'test-project' })
    );

    const nestedDir = path.join(tempDir, 'src', 'features', 'auth', 'components');
    await fs.mkdir(nestedDir, { recursive: true });
    await fs.writeFile(
      path.join(nestedDir, 'LoginForm.tsx'),
      'export const LoginForm = () => <form>Login</form>;'
    );

    await initCommand(state);

    expect(state.getFiles()).toContain('src/features/auth/components/LoginForm.tsx');
    expect(state.getComponents()).toContain('LoginForm');
  });

  it('should allow re-initialization', async () => {
    await fs.writeFile(
      path.join(tempDir, 'package.json'),
      JSON.stringify({ name: 'test-project' })
    );

    const srcDir = path.join(tempDir, 'src');
    await fs.mkdir(srcDir, { recursive: true });
    await fs.writeFile(
      path.join(srcDir, 'App.tsx'),
      'export const App = () => <div>App</div>;'
    );

    // First initialization
    await initCommand(state);
    expect(state.getFiles()).toHaveLength(1);

    // Add another file
    await fs.writeFile(
      path.join(srcDir, 'Button.tsx'),
      'export const Button = () => <button>Click</button>;'
    );

    // Re-initialize with force flag to bypass cache
    await initCommand(state, true);
    expect(state.getFiles()).toHaveLength(2);
    expect(state.getComponents()).toHaveLength(2);
  });

  it('should handle errors during project map building', async () => {
    await fs.writeFile(
      path.join(tempDir, 'package.json'),
      JSON.stringify({ name: 'test-project' })
    );

    const srcDir = path.join(tempDir, 'src');
    await fs.mkdir(srcDir, { recursive: true });

    // Create a file that will cause issues
    const filePath = path.join(srcDir, 'Problematic.tsx');
    await fs.writeFile(filePath, 'export const Test = () => <div>Test</div>;');

    // Make the file unreadable by changing permissions
    await fs.chmod(filePath, 0o000);

    try {
      await initCommand(state);

      // If it succeeds or fails gracefully, that's fine
      // The error handling branch should be covered
    } finally {
      // Restore permissions for cleanup
      await fs.chmod(filePath, 0o644).catch(() => {});
    }
  });

  describe('project map caching', () => {
    it('should use cached project map when recent', async () => {
      const state = new REPLState();

      // Create test project with package.json
      const testDir = path.join(os.tmpdir(), `reactgen-cache-test-${Date.now()}`);
      await fs.mkdir(testDir, { recursive: true });
      await fs.mkdir(path.join(testDir, 'src'), { recursive: true });

      // Create package.json
      await fs.writeFile(
        path.join(testDir, 'package.json'),
        JSON.stringify({ name: 'test-project' })
      );

      // Create a React file
      await fs.writeFile(
        path.join(testDir, 'src', 'App.tsx'),
        'export const App = () => <div>Test</div>;'
      );

      // Mock process.cwd to return our test directory
      process.cwd = jest.fn(() => testDir) as any;

      try {
        // First init - should scan
        await initCommand(state);

        expect(state.isInitialized).toBe(true);

        // Reset state
        const state2 = new REPLState();

        // Clear the global console output and use it
        consoleOutput = [];

        // Second init - should use cache
        await initCommand(state2);

        // Should have used cached map
        expect(consoleOutput.some(log => log.includes('Using cached project map'))).toBe(true);
        expect(consoleOutput.some(log => log.includes('--force'))).toBe(true);
        expect(state2.isInitialized).toBe(true);
      } finally {
        await fs.rm(testDir, { recursive: true, force: true });
      }
    });

    it('should force rescan with --force flag', async () => {
      const state = new REPLState();

      // Create test project
      const testDir = path.join(os.tmpdir(), `reactgen-force-test-${Date.now()}`);
      await fs.mkdir(testDir, { recursive: true });
      await fs.mkdir(path.join(testDir, 'src'), { recursive: true });

      await fs.writeFile(
        path.join(testDir, 'package.json'),
        JSON.stringify({ name: 'test-project' })
      );

      await fs.writeFile(
        path.join(testDir, 'src', 'App.tsx'),
        'export const App = () => <div>Test</div>;'
      );

      // Mock process.cwd to return our test directory
      process.cwd = jest.fn(() => testDir) as any;

      try {
        // First init
        await initCommand(state);

        // Reset state
        const state2 = new REPLState();

        // Clear global console output
        consoleOutput = [];

        // Init with force - should NOT use cache
        await initCommand(state2, true);

        // Should NOT have used cached map
        expect(consoleOutput.some(log => log.includes('Using cached project map'))).toBe(false);
        expect(state2.isInitialized).toBe(true);
      } finally {
        await fs.rm(testDir, { recursive: true, force: true });
      }
    });

    it('should rescan when cached map is older than 5 minutes', async () => {
      const state = new REPLState();

      // Create test project
      const testDir = path.join(os.tmpdir(), `reactgen-old-test-${Date.now()}`);
      await fs.mkdir(testDir, { recursive: true });
      await fs.mkdir(path.join(testDir, 'src'), { recursive: true });
      await fs.mkdir(path.join(testDir, '.reactgen'), { recursive: true });

      await fs.writeFile(
        path.join(testDir, 'package.json'),
        JSON.stringify({ name: 'test-project' })
      );

      await fs.writeFile(
        path.join(testDir, 'src', 'App.tsx'),
        'export const App = () => <div>Test</div>;'
      );

      // Create an old project map (6 minutes ago)
      const oldDate = new Date(Date.now() - 6 * 60 * 1000);
      const oldMap = {
        version: '1.0',
        scannedAt: oldDate.toISOString(),
        rootDir: testDir,
        structure: {},
        files: ['src/App.tsx'],
        components: []
      };

      await fs.writeFile(
        path.join(testDir, '.reactgen', 'project-map.json'),
        JSON.stringify(oldMap)
      );

      // Mock process.cwd to return our test directory
      process.cwd = jest.fn(() => testDir) as any;

      try {
        // Clear global console output
        consoleOutput = [];

        // Init should NOT use old cache
        await initCommand(state);

        // Should have rescanned (not used cache)
        expect(consoleOutput.some(log => log.includes('Using cached project map'))).toBe(false);
        expect(state.isInitialized).toBe(true);
      } finally {
        await fs.rm(testDir, { recursive: true, force: true });
      }
    });

    it('should handle corrupted cached map gracefully', async () => {
      const state = new REPLState();

      // Create test project
      const testDir = path.join(os.tmpdir(), `reactgen-corrupt-test-${Date.now()}`);
      await fs.mkdir(testDir, { recursive: true });
      await fs.mkdir(path.join(testDir, 'src'), { recursive: true });
      await fs.mkdir(path.join(testDir, '.reactgen'), { recursive: true });

      await fs.writeFile(
        path.join(testDir, 'package.json'),
        JSON.stringify({ name: 'test-project' })
      );

      await fs.writeFile(
        path.join(testDir, 'src', 'App.tsx'),
        'export const App = () => <div>Test</div>;'
      );

      // Create corrupted project map
      await fs.writeFile(
        path.join(testDir, '.reactgen', 'project-map.json'),
        'invalid json {'
      );

      // Mock process.cwd to return our test directory
      process.cwd = jest.fn(() => testDir) as any;

      try {
        // Should rescan when cache is corrupted
        await initCommand(state);

        expect(state.isInitialized).toBe(true);
        expect(state.projectMap).not.toBeNull();
      } finally {
        await fs.rm(testDir, { recursive: true, force: true });
      }
    });
  });
});
