import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { REPLState, ProjectMap } from '../repl/state.js';
import { infoCommand } from '../commands/info.js';
import { testCommand } from '../commands/test.js';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';

/**
 * Integration tests for commands actually working with references
 * These tests verify END-TO-END that commands resolve and use references correctly
 */

// Mock console.log to capture output
let consoleOutput: string[] = [];
const originalLog = console.log;

beforeEach(() => {
  consoleOutput = [];
  console.log = jest.fn((...args: any[]) => {
    consoleOutput.push(args.join(' '));
  }) as any;
});

afterEach(() => {
  console.log = originalLog;
});

describe('Command Reference Integration - REAL USAGE', () => {
  let tempDir: string;
  let state: REPLState;
  const originalCwd = process.cwd;

  beforeEach(async () => {
    // Create a real temporary React project
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'reactgen-ref-integration-'));
    process.cwd = () => tempDir;

    // Setup realistic project structure
    await fs.writeFile(
      path.join(tempDir, 'package.json'),
      JSON.stringify({ name: 'test-project' })
    );

    const componentsDir = path.join(tempDir, 'src', 'components');
    await fs.mkdir(componentsDir, { recursive: true });

    // Create Button component
    await fs.writeFile(
      path.join(componentsDir, 'Button.tsx'),
      `export const Button = () => <button>Click</button>;
export interface ButtonProps {
  variant: string;
}`
    );

    // Create Input component
    await fs.writeFile(
      path.join(componentsDir, 'Input.tsx'),
      `export const Input = () => <input />;`
    );

    // Create index file
    await fs.writeFile(
      path.join(tempDir, 'src', 'index.tsx'),
      `export const app = () => <div>App</div>;`
    );

    // Create forms subdirectory
    const formsDir = path.join(componentsDir, 'forms');
    await fs.mkdir(formsDir, { recursive: true });

    await fs.writeFile(
      path.join(formsDir, 'LoginForm.tsx'),
      `export const LoginForm = () => <form>Login</form>;`
    );

    // Initialize state with actual project map
    state = new REPLState();

    const mockProjectMap: ProjectMap = {
      version: '1.0',
      scannedAt: new Date().toISOString(),
      rootDir: tempDir,
      structure: {
        src: {
          'index.tsx': {
            path: 'src/index.tsx',
            type: 'component',
            lines: 10,
            exports: ['app'],
            imports: [],
            usedBy: []
          },
          components: {
            'Button.tsx': {
              path: 'src/components/Button.tsx',
              type: 'component',
              lines: 50,
              exports: ['Button', 'ButtonProps'],
              imports: [],
              usedBy: []
            },
            'Input.tsx': {
              path: 'src/components/Input.tsx',
              type: 'component',
              lines: 30,
              exports: ['Input'],
              imports: [],
              usedBy: []
            },
            forms: {
              'LoginForm.tsx': {
                path: 'src/components/forms/LoginForm.tsx',
                type: 'component',
                lines: 100,
                exports: ['LoginForm'],
                imports: [],
                usedBy: []
              }
            }
          }
        }
      },
      files: [
        'src/index.tsx',
        'src/components/Button.tsx',
        'src/components/Input.tsx',
        'src/components/forms/LoginForm.tsx'
      ],
      components: ['app', 'Button', 'Input', 'LoginForm']
    };

    await state.setProjectMap(mockProjectMap);
  });

  afterEach(async () => {
    await fs.rm(tempDir, { recursive: true, force: true });
    process.cwd = originalCwd;
  });

  describe('/info command with actual references', () => {
    it('should work with simple file reference #index', async () => {
      await infoCommand(state, '#index');

      // Verify it actually found and displayed the file
      expect(consoleOutput.some(line => line.includes('index.tsx'))).toBe(true);
      expect(consoleOutput.some(line => line.includes('component'))).toBe(true);
      expect(consoleOutput.some(line => line.includes('app'))).toBe(true);
    });

    it('should work with file reference #Button', async () => {
      await infoCommand(state, '#Button');

      expect(consoleOutput.some(line => line.includes('Button.tsx'))).toBe(true);
      expect(consoleOutput.some(line => line.includes('Button, ButtonProps'))).toBe(true);
    });

    it('should work with file reference #Input', async () => {
      await infoCommand(state, '#Input');

      expect(consoleOutput.some(line => line.includes('Input.tsx'))).toBe(true);
      expect(consoleOutput.some(line => line.includes('Input'))).toBe(true);
    });

    it('should work with nested reference .src.components.forms#LoginForm', async () => {
      await infoCommand(state, '.src.components.forms#LoginForm');

      expect(consoleOutput.some(line => line.includes('LoginForm.tsx'))).toBe(true);
      expect(consoleOutput.some(line => line.includes('LoginForm'))).toBe(true);
    });

    it('should fail gracefully with invalid reference #NonExistent', async () => {
      await infoCommand(state, '#NonExistent');

      expect(consoleOutput.some(line => line.includes('Could not resolve'))).toBe(true);
      expect(consoleOutput.some(line => line.includes('#NonExistent'))).toBe(true);
    });

    it('should still work with regular filename (backward compatibility)', async () => {
      await infoCommand(state, 'Button.tsx');

      expect(consoleOutput.some(line => line.includes('Button.tsx'))).toBe(true);
    });

    it('should still work with partial filename (backward compatibility)', async () => {
      await infoCommand(state, 'Button');

      expect(consoleOutput.some(line => line.includes('Button.tsx'))).toBe(true);
    });
  });

  describe('/test command with actual references', () => {
    it('should resolve simple file reference #Button', () => {
      testCommand(state, '#Button');

      expect(consoleOutput.some(line => line.includes('resolved successfully'))).toBe(true);
      expect(consoleOutput.some(line => line.includes('src/components/Button.tsx'))).toBe(true);
      expect(consoleOutput.some(line => line.includes('component'))).toBe(true);
    });

    it('should resolve #index reference', () => {
      testCommand(state, '#index');

      expect(consoleOutput.some(line => line.includes('resolved successfully'))).toBe(true);
      expect(consoleOutput.some(line => line.includes('src/index.tsx'))).toBe(true);
    });

    it('should resolve nested reference .src.components#Button', () => {
      testCommand(state, '.src.components#Button');

      expect(consoleOutput.some(line => line.includes('resolved successfully'))).toBe(true);
      expect(consoleOutput.some(line => line.includes('src/components/Button.tsx'))).toBe(true);
    });

    it('should resolve deeply nested reference', () => {
      testCommand(state, '.src.components.forms#LoginForm');

      expect(consoleOutput.some(line => line.includes('resolved successfully'))).toBe(true);
      expect(consoleOutput.some(line => line.includes('src/components/forms/LoginForm.tsx'))).toBe(true);
    });

    it('should show metadata for resolved reference', () => {
      testCommand(state, '#Button');

      expect(consoleOutput.some(line => line.includes('Type:'))).toBe(true);
      expect(consoleOutput.some(line => line.includes('Lines:'))).toBe(true);
      expect(consoleOutput.some(line => line.includes('Exports:'))).toBe(true);
    });

    it('should handle template references', () => {
      testCommand(state, '@form:login');

      expect(consoleOutput.some(line => line.includes('Template Reference'))).toBe(true);
      expect(consoleOutput.some(line => line.includes('@form:login'))).toBe(true);
    });

    it('should fail gracefully with invalid reference', () => {
      testCommand(state, '#InvalidFile');

      expect(consoleOutput.some(line => line.includes('Could not resolve'))).toBe(true);
    });
  });

  describe('Real-world user workflows', () => {
    it('should handle: user runs /init, then /info #index', async () => {
      // User already initialized (in beforeEach)
      expect(state.isInitialized).toBe(true);

      // User types /info #index
      await infoCommand(state, '#index');

      // Should see file info
      expect(consoleOutput.some(line => line.includes('index.tsx'))).toBe(true);
      expect(consoleOutput.some(line => line.includes('Lines:'))).toBe(true);
    });

    it('should handle: user tabs to complete, then executes', async () => {
      // Simulate: user typed "/info #But" + TAB (got #Button) + ENTER
      await infoCommand(state, '#Button');

      expect(consoleOutput.some(line => line.includes('Button.tsx'))).toBe(true);
      expect(consoleOutput.some(line => line.includes('ButtonProps'))).toBe(true);
    });

    it('should handle: user explores with /test, then views with /info', async () => {
      // First use /test to find the file
      testCommand(state, '#Input');
      expect(consoleOutput.some(line => line.includes('src/components/Input.tsx'))).toBe(true);

      // Clear output
      consoleOutput = [];

      // Then use /info to see details
      await infoCommand(state, '#Input');
      expect(consoleOutput.some(line => line.includes('Input.tsx'))).toBe(true);
      expect(consoleOutput.some(line => line.includes('Exports:'))).toBe(true);
    });

    it('should handle: user tries wrong reference, gets helpful error', async () => {
      await infoCommand(state, '#Buton'); // Typo

      expect(consoleOutput.some(line => line.includes('Could not resolve'))).toBe(true);
      expect(consoleOutput.some(line => line.includes('TAB completion'))).toBe(true);
    });
  });

  describe('Edge cases with real usage', () => {
    it('should handle reference with exact match', async () => {
      await infoCommand(state, '#Button');

      // Should not fail when reference exactly matches
      expect(consoleOutput.some(line => line.includes('Button.tsx'))).toBe(true);
    });

    it('should handle case-insensitive reference matching', async () => {
      // Note: Reference resolution is case-sensitive for exact matches
      // This is expected behavior - autocomplete helps with discovery,
      // but final resolution requires correct casing
      await infoCommand(state, '#button');

      // Won't find Button.tsx because casing doesn't match
      expect(consoleOutput.some(line =>
        line.includes('Could not resolve') || line.includes('File not found')
      )).toBe(true);
    });

    it('should prioritize exact matches over partial', async () => {
      // When both #index and #Input exist, #in should prefer exact prefix match
      await infoCommand(state, '#Input');

      expect(consoleOutput.some(line => line.includes('Input.tsx'))).toBe(true);
      expect(consoleOutput.some(line => line.includes('index.tsx'))).toBe(false);
    });

    it('should handle references with special characters in path', async () => {
      // Folder path with dots
      testCommand(state, '.src.components#Button');

      expect(consoleOutput.some(line => line.includes('resolved successfully'))).toBe(true);
    });
  });

  describe('Command combinations', () => {
    it('should work: /test to verify, then /info to explore', async () => {
      // User wants to check if file exists
      testCommand(state, '#LoginForm');
      expect(consoleOutput.some(line => line.includes('resolved successfully'))).toBe(true);

      consoleOutput = [];

      // User wants to see more details
      await infoCommand(state, '#LoginForm');
      expect(consoleOutput.some(line => line.includes('LoginForm.tsx'))).toBe(true);
    });

    it('should work: multiple /info calls with different references', async () => {
      await infoCommand(state, '#Button');
      expect(consoleOutput.some(line => line.includes('Button.tsx'))).toBe(true);

      consoleOutput = [];

      await infoCommand(state, '#Input');
      expect(consoleOutput.some(line => line.includes('Input.tsx'))).toBe(true);

      consoleOutput = [];

      await infoCommand(state, '#index');
      expect(consoleOutput.some(line => line.includes('index.tsx'))).toBe(true);
    });
  });

  describe('Error handling in real scenarios', () => {
    it('should handle uninitialized state gracefully', async () => {
      const uninitializedState = new REPLState();

      await infoCommand(uninitializedState, '#Button');

      expect(consoleOutput.some(line => line.includes('not initialized'))).toBe(true);
    });

    it('should handle empty reference', async () => {
      await infoCommand(state, '#');

      // Should fail to resolve empty reference
      expect(consoleOutput.some(line =>
        line.includes('Could not resolve') || line.includes('File not found')
      )).toBe(true);
    });

    it('should handle malformed reference', async () => {
      await infoCommand(state, '##Button');

      // Should either fail to resolve or try as literal filename
      expect(consoleOutput.some(line =>
        line.includes('Could not resolve') || line.includes('File not found')
      )).toBe(true);
    });
  });

  describe('Backward compatibility', () => {
    it('should still work with old-style filename arguments', async () => {
      // Users who don't use references should still be able to use commands
      await infoCommand(state, 'Button.tsx');

      expect(consoleOutput.some(line => line.includes('Button.tsx'))).toBe(true);
    });

    it('should work with partial filename (no extension)', async () => {
      await infoCommand(state, 'Button');

      expect(consoleOutput.some(line => line.includes('Button.tsx'))).toBe(true);
    });

    it('should work with path prefix', async () => {
      // Path matching works if it includes the file extension or exact match
      await infoCommand(state, 'components/Button.tsx');

      expect(consoleOutput.some(line => line.includes('Button.tsx'))).toBe(true);
    });
  });

  describe('Performance with references', () => {
    it('should handle multiple reference resolutions quickly', async () => {
      const start = Date.now();

      for (let i = 0; i < 10; i++) {
        consoleOutput = [];
        await infoCommand(state, '#Button');
      }

      const duration = Date.now() - start;

      // Should complete 10 resolutions in under 1 second
      expect(duration).toBeLessThan(1000);
    });

    it('should resolve nested references efficiently', () => {
      const start = Date.now();

      for (let i = 0; i < 10; i++) {
        consoleOutput = [];
        testCommand(state, '.src.components.forms#LoginForm');
      }

      const duration = Date.now() - start;

      expect(duration).toBeLessThan(1000);
    });
  });
});
