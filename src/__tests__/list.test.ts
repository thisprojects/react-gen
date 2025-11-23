import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { listCommand } from '../commands/list.js';
import { REPLState } from '../repl/state.js';
import type { ProjectMap } from '../core/mapper.js';

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

describe('listCommand', () => {
  let state: REPLState;

  beforeEach(() => {
    state = new REPLState();
  });

  it('should show message when no files found', async () => {
    await listCommand(state);

    expect(consoleOutput.some(line => line.includes('No files found'))).toBe(true);
    expect(consoleOutput.some(line => line.includes('/init'))).toBe(true);
  });

  it('should list all files when no filter provided', async () => {
    const projectMap: ProjectMap = {
      version: '1.0',
      scannedAt: new Date().toISOString(),
      rootDir: '/test',
      structure: {},
      files: ['src/App.tsx', 'src/Button.tsx', 'components/Header.tsx'],
      components: []
    };

    state.setProjectMap(projectMap);

    await listCommand(state);

    expect(consoleOutput.some(line => line.includes('Files (3 total'))).toBe(true);
    expect(consoleOutput.some(line => line.includes('App.tsx'))).toBe(true);
    expect(consoleOutput.some(line => line.includes('Button.tsx'))).toBe(true);
    expect(consoleOutput.some(line => line.includes('Header.tsx'))).toBe(true);
  });

  it('should group files by directory', async () => {
    const projectMap: ProjectMap = {
      version: '1.0',
      scannedAt: new Date().toISOString(),
      rootDir: '/test',
      structure: {},
      files: ['src/App.tsx', 'src/Button.tsx', 'components/Header.tsx'],
      components: []
    };

    state.setProjectMap(projectMap);

    await listCommand(state);

    expect(consoleOutput.some(line => line.includes('src/'))).toBe(true);
    expect(consoleOutput.some(line => line.includes('components/'))).toBe(true);
  });

  it('should filter files by search term', async () => {
    const projectMap: ProjectMap = {
      version: '1.0',
      scannedAt: new Date().toISOString(),
      rootDir: '/test',
      structure: {},
      files: ['src/App.tsx', 'src/Button.tsx', 'src/Input.tsx'],
      components: []
    };

    state.setProjectMap(projectMap);

    await listCommand(state, 'Button');

    expect(consoleOutput.some(line => line.includes('Files (1 total'))).toBe(true);
    expect(consoleOutput.some(line => line.includes('Button.tsx'))).toBe(true);
    expect(consoleOutput.some(line => line.includes('App.tsx'))).toBe(false);
    expect(consoleOutput.some(line => line.includes('Input.tsx'))).toBe(false);
  });

  it('should filter case-insensitively', async () => {
    const projectMap: ProjectMap = {
      version: '1.0',
      scannedAt: new Date().toISOString(),
      rootDir: '/test',
      structure: {},
      files: ['src/MyComponent.tsx', 'src/OtherComponent.tsx'],
      components: []
    };

    state.setProjectMap(projectMap);

    await listCommand(state, 'mycomponent');

    expect(consoleOutput.some(line => line.includes('Files (1 total'))).toBe(true);
    expect(consoleOutput.some(line => line.includes('MyComponent.tsx'))).toBe(true);
  });

  it('should show message when filter matches no files', async () => {
    const projectMap: ProjectMap = {
      version: '1.0',
      scannedAt: new Date().toISOString(),
      rootDir: '/test',
      structure: {},
      files: ['src/App.tsx', 'src/Button.tsx'],
      components: []
    };

    state.setProjectMap(projectMap);

    await listCommand(state, 'NonExistent');

    expect(consoleOutput.some(line => line.includes('No files matching'))).toBe(true);
    expect(consoleOutput.some(line => line.includes('NonExistent'))).toBe(true);
  });

  it('should filter by directory name', async () => {
    const projectMap: ProjectMap = {
      version: '1.0',
      scannedAt: new Date().toISOString(),
      rootDir: '/test',
      structure: {},
      files: ['src/App.tsx', 'components/Header.tsx', 'app/page.tsx'],
      components: []
    };

    state.setProjectMap(projectMap);

    await listCommand(state, 'components');

    expect(consoleOutput.some(line => line.includes('Files (1 total'))).toBe(true);
    expect(consoleOutput.some(line => line.includes('Header.tsx'))).toBe(true);
    expect(consoleOutput.some(line => line.includes('App.tsx'))).toBe(false);
  });

  it('should show test icon for test files', async () => {
    const projectMap: ProjectMap = {
      version: '1.0',
      scannedAt: new Date().toISOString(),
      rootDir: '/test',
      structure: {},
      files: ['src/Button.test.tsx', 'src/Input.spec.tsx'],
      components: []
    };

    state.setProjectMap(projectMap);

    await listCommand(state);

    expect(consoleOutput.some(line => line.includes('🧪'))).toBe(true);
  });

  it('should show file icon for non-test files', async () => {
    const projectMap: ProjectMap = {
      version: '1.0',
      scannedAt: new Date().toISOString(),
      rootDir: '/test',
      structure: {},
      files: ['src/App.tsx'],
      components: []
    };

    state.setProjectMap(projectMap);

    await listCommand(state);

    expect(consoleOutput.some(line => line.includes('📄'))).toBe(true);
  });

  it('should handle deeply nested directories', async () => {
    const projectMap: ProjectMap = {
      version: '1.0',
      scannedAt: new Date().toISOString(),
      rootDir: '/test',
      structure: {},
      files: ['src/features/auth/components/LoginForm.tsx'],
      components: []
    };

    state.setProjectMap(projectMap);

    await listCommand(state);

    expect(consoleOutput.some(line => line.includes('src/features/auth/components/'))).toBe(true);
    expect(consoleOutput.some(line => line.includes('LoginForm.tsx'))).toBe(true);
  });

  it('should handle files in root directory', async () => {
    const projectMap: ProjectMap = {
      version: '1.0',
      scannedAt: new Date().toISOString(),
      rootDir: '/test',
      structure: {},
      files: ['App.tsx'],
      components: []
    };

    state.setProjectMap(projectMap);

    await listCommand(state);

    expect(consoleOutput.some(line => line.includes('./'))).toBe(true);
    expect(consoleOutput.some(line => line.includes('App.tsx'))).toBe(true);
  });

  it('should filter by file extension', async () => {
    const projectMap: ProjectMap = {
      version: '1.0',
      scannedAt: new Date().toISOString(),
      rootDir: '/test',
      structure: {},
      files: ['src/App.tsx', 'src/Legacy.jsx'],
      components: []
    };

    state.setProjectMap(projectMap);

    await listCommand(state, '.jsx');

    expect(consoleOutput.some(line => line.includes('Files (1 total'))).toBe(true);
    expect(consoleOutput.some(line => line.includes('Legacy.jsx'))).toBe(true);
  });

  it('should show correct count with multiple files in same directory', async () => {
    const projectMap: ProjectMap = {
      version: '1.0',
      scannedAt: new Date().toISOString(),
      rootDir: '/test',
      structure: {},
      files: [
        'src/components/Button.tsx',
        'src/components/Input.tsx',
        'src/components/Select.tsx',
        'src/components/Checkbox.tsx'
      ],
      components: []
    };

    state.setProjectMap(projectMap);

    await listCommand(state);

    expect(consoleOutput.some(line => line.includes('Files (4 total'))).toBe(true);
  });

  it('should handle partial filename matches', async () => {
    const projectMap: ProjectMap = {
      version: '1.0',
      scannedAt: new Date().toISOString(),
      rootDir: '/test',
      structure: {},
      files: [
        'src/UserProfile.tsx',
        'src/UserSettings.tsx',
        'src/AdminPanel.tsx'
      ],
      components: []
    };

    state.setProjectMap(projectMap);

    await listCommand(state, 'User');

    expect(consoleOutput.some(line => line.includes('Files (2 total'))).toBe(true);
    expect(consoleOutput.some(line => line.includes('UserProfile.tsx'))).toBe(true);
    expect(consoleOutput.some(line => line.includes('UserSettings.tsx'))).toBe(true);
    expect(consoleOutput.some(line => line.includes('AdminPanel.tsx'))).toBe(false);
  });

  describe('file count summary', () => {
    it('should show breakdown when test files are present', async () => {
      const projectMap: ProjectMap = {
        version: '1.0',
        scannedAt: new Date().toISOString(),
        rootDir: '/test',
        structure: {},
        files: [
          'src/Button.tsx',
          'src/Button.test.tsx',
          'src/Card.tsx',
          'src/Card.test.tsx',
          'src/Header.tsx'
        ],
        components: []
      };

      state.setProjectMap(projectMap);

      await listCommand(state);

      // Should show: 5 total, 3 components, 2 tests
      expect(consoleOutput.some(line => line.includes('5 total'))).toBe(true);
      expect(consoleOutput.some(line => line.includes('3 components'))).toBe(true);
      expect(consoleOutput.some(line => line.includes('2 tests'))).toBe(true);
    });

    it('should show "total" only when no test files', async () => {
      const projectMap: ProjectMap = {
        version: '1.0',
        scannedAt: new Date().toISOString(),
        rootDir: '/test',
        structure: {},
        files: [
          'src/Button.tsx',
          'src/Card.tsx',
          'src/Header.tsx'
        ],
        components: []
      };

      state.setProjectMap(projectMap);

      await listCommand(state);

      // Should show: 3 total (no breakdown)
      expect(consoleOutput.some(line => line.includes('3 total'))).toBe(true);
      expect(consoleOutput.some(line => line.includes('components'))).toBe(false);
      expect(consoleOutput.some(line => line.includes('tests'))).toBe(false);
    });

    it('should count .spec. files as tests', async () => {
      const projectMap: ProjectMap = {
        version: '1.0',
        scannedAt: new Date().toISOString(),
        rootDir: '/test',
        structure: {},
        files: [
          'src/utils.ts',
          'src/utils.spec.ts',
          'src/helpers.ts',
          'src/helpers.spec.ts'
        ],
        components: []
      };

      state.setProjectMap(projectMap);

      await listCommand(state);

      // Should count both .spec. files as tests
      expect(consoleOutput.some(line => line.includes('4 total'))).toBe(true);
      expect(consoleOutput.some(line => line.includes('2 components'))).toBe(true);
      expect(consoleOutput.some(line => line.includes('2 tests'))).toBe(true);
    });

    it('should apply count to filtered results', async () => {
      const projectMap: ProjectMap = {
        version: '1.0',
        scannedAt: new Date().toISOString(),
        rootDir: '/test',
        structure: {},
        files: [
          'src/Button.tsx',
          'src/Button.test.tsx',
          'src/Card.tsx',
          'src/Card.test.tsx',
          'src/Header.tsx'
        ],
        components: []
      };

      state.setProjectMap(projectMap);

      await listCommand(state, 'Button');

      // Should show filtered count: 2 total, 1 components, 1 tests
      expect(consoleOutput.some(line => line.includes('2 total'))).toBe(true);
      expect(consoleOutput.some(line => line.includes('1 components'))).toBe(true);
      expect(consoleOutput.some(line => line.includes('1 tests'))).toBe(true);
    });

    it('should handle all test files', async () => {
      const projectMap: ProjectMap = {
        version: '1.0',
        scannedAt: new Date().toISOString(),
        rootDir: '/test',
        structure: {},
        files: [
          'src/Button.test.tsx',
          'src/Card.test.tsx',
          'src/utils.spec.ts'
        ],
        components: []
      };

      state.setProjectMap(projectMap);

      await listCommand(state);

      // Should show: 3 total, 0 components, 3 tests
      expect(consoleOutput.some(line => line.includes('3 total'))).toBe(true);
      expect(consoleOutput.some(line => line.includes('0 components'))).toBe(true);
      expect(consoleOutput.some(line => line.includes('3 tests'))).toBe(true);
    });
  });
});
