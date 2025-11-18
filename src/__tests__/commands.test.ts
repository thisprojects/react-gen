import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { handleCommand } from '../repl/commands.js';
import { REPLState } from '../repl/state.js';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';

// Mock console.log to capture output
let consoleOutput: string[] = [];
const originalLog = console.log;
const originalCwd = process.cwd;

beforeEach(() => {
  consoleOutput = [];
  console.log = jest.fn((...args: any[]) => {
    consoleOutput.push(args.join(' '));
  }) as any;
});

afterEach(() => {
  console.log = originalLog;
  process.cwd = originalCwd;
});

describe('handleCommand', () => {
  let state: REPLState;

  beforeEach(() => {
    state = new REPLState();
  });

  describe('command validation', () => {
    it('should reject commands that do not start with /', async () => {
      const result = await handleCommand('hello', state);

      expect(result).toBe(true); // Should continue REPL
      expect(consoleOutput.some(line => line.includes('Commands must start with /'))).toBe(true);
    });

    it('should show help for invalid commands', async () => {
      const result = await handleCommand('hello', state);

      expect(consoleOutput.some(line => line.includes('/help'))).toBe(true);
    });
  });

  describe('/help command', () => {
    it('should display help message', async () => {
      const result = await handleCommand('/help', state);

      expect(result).toBe(true);
      expect(consoleOutput.length).toBeGreaterThan(0);
    });

    it('should be case insensitive', async () => {
      const result = await handleCommand('/HELP', state);

      expect(result).toBe(true);
      expect(consoleOutput.length).toBeGreaterThan(0);
    });
  });

  describe('/clear command', () => {
    it('should handle clear command', async () => {
      const result = await handleCommand('/clear', state);

      expect(result).toBe(true);
    });

    it('should be case insensitive', async () => {
      const result = await handleCommand('/CLEAR', state);

      expect(result).toBe(true);
    });
  });

  describe('/exit command', () => {
    it('should return false to signal REPL exit', async () => {
      const result = await handleCommand('/exit', state);

      expect(result).toBe(false);
    });

    it('should handle /quit as alias', async () => {
      const result = await handleCommand('/quit', state);

      expect(result).toBe(false);
    });

    it('should be case insensitive', async () => {
      const result = await handleCommand('/EXIT', state);

      expect(result).toBe(false);
    });
  });

  describe('unknown commands', () => {
    it('should show error for unknown command', async () => {
      const result = await handleCommand('/unknown', state);

      expect(result).toBe(true);
      expect(consoleOutput.some(line => line.includes('Unknown command'))).toBe(true);
      expect(consoleOutput.some(line => line.includes('/unknown'))).toBe(true);
    });

    it('should suggest using /help', async () => {
      const result = await handleCommand('/notacommand', state);

      expect(consoleOutput.some(line => line.includes('/help'))).toBe(true);
    });
  });

  describe('commands requiring initialization', () => {
    it('/list should warn if not initialized', async () => {
      const result = await handleCommand('/list', state);

      expect(result).toBe(true);
      expect(consoleOutput.some(line => line.includes('not initialized'))).toBe(true);
      expect(consoleOutput.some(line => line.includes('/init'))).toBe(true);
    });

    it('/info should warn if not initialized', async () => {
      const result = await handleCommand('/info Component.tsx', state);

      expect(result).toBe(true);
      expect(consoleOutput.some(line => line.includes('not initialized'))).toBe(true);
    });

    it('/info should show usage when no filename provided', async () => {
      // Initialize state with mock data
      state.setProjectMap({
        version: '1.0',
        scannedAt: new Date().toISOString(),
        rootDir: '/test',
        structure: {},
        files: [],
        components: []
      });

      const result = await handleCommand('/info', state);

      expect(result).toBe(true);
      expect(consoleOutput.some(line => line.includes('Usage:'))).toBe(true);
    });

    it('/list should execute when initialized', async () => {
      // Initialize state with mock data
      state.setProjectMap({
        version: '1.0',
        scannedAt: new Date().toISOString(),
        rootDir: '/test',
        structure: {},
        files: ['src/App.tsx'],
        components: ['App']
      });

      const result = await handleCommand('/list', state);

      expect(result).toBe(true);
      expect(consoleOutput.some(line => line.includes('App.tsx'))).toBe(true);
    });

    it('/info should execute when initialized with valid filename', async () => {
      // Initialize state with mock data
      state.setProjectMap({
        version: '1.0',
        scannedAt: new Date().toISOString(),
        rootDir: '/test',
        structure: {
          src: {
            'App.tsx': {
              path: 'src/App.tsx',
              type: 'component',
              lines: 50,
              exports: ['App'],
              imports: [],
              usedBy: []
            }
          }
        },
        files: ['src/App.tsx'],
        components: ['App']
      });

      const result = await handleCommand('/info App.tsx', state);

      expect(result).toBe(true);
      expect(consoleOutput.some(line => line.includes('src/App.tsx'))).toBe(true);
    });
  });

  describe('command parsing', () => {
    it('should handle commands with arguments', async () => {
      const result = await handleCommand('/list components', state);

      expect(result).toBe(true);
      // Should still warn about initialization
      expect(consoleOutput.some(line => line.includes('not initialized'))).toBe(true);
    });

    it('should handle commands with multiple spaces', async () => {
      const result = await handleCommand('/help   ', state);

      expect(result).toBe(true);
      expect(consoleOutput.length).toBeGreaterThan(0);
    });

    it('should trim whitespace from commands', async () => {
      const result = await handleCommand('  /help  ', state);

      expect(result).toBe(true);
      expect(consoleOutput.length).toBeGreaterThan(0);
    });
  });

  describe('/init command integration', () => {
    let tempDir: string;

    beforeEach(async () => {
      tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'reactgen-cmd-test-'));
      process.cwd = jest.fn(() => tempDir) as any;
    });

    afterEach(async () => {
      await fs.rm(tempDir, { recursive: true, force: true });
    });

    it('should execute /init command successfully with valid project', async () => {
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

      const result = await handleCommand('/init', state);

      expect(result).toBe(true);
      expect(state.requiresInit()).toBe(false);
      expect(consoleOutput.some(line => line.includes('Found 1 React files'))).toBe(true);
    });
  });
});
