import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { testCommand } from '../commands/test.js';
import { REPLState, ProjectMap } from '../repl/state.js';

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

describe('testCommand', () => {
  let state: REPLState;

  beforeEach(async () => {
    state = new REPLState();

    // Create a mock project map
    const mockProjectMap: ProjectMap = {
      version: '1.0',
      scannedAt: new Date().toISOString(),
      rootDir: '/test/project',
      structure: {
        src: {
          components: {
            'Button.tsx': {
              path: 'src/components/Button.tsx',
              type: 'component',
              lines: 50,
              exports: ['Button', 'ButtonProps'],
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
        'src/components/Button.tsx',
        'src/components/forms/LoginForm.tsx'
      ],
      components: ['Button', 'LoginForm']
    };

    await state.setProjectMap(mockProjectMap);
  });

  it('should show usage when no reference provided', () => {
    testCommand(state, '');

    expect(consoleOutput.some(line => line.includes('Usage:'))).toBe(true);
    expect(consoleOutput.some(line => line.includes('Examples:'))).toBe(true);
  });

  it('should handle template references', () => {
    testCommand(state, '@form:login');

    expect(consoleOutput.some(line => line.includes('Template Reference'))).toBe(true);
    expect(consoleOutput.some(line => line.includes('@form:login'))).toBe(true);
    expect(consoleOutput.some(line => line.includes('Phase 3'))).toBe(true);
  });

  it('should resolve simple file reference', () => {
    testCommand(state, '#Button');

    expect(consoleOutput.some(line => line.includes('resolved successfully'))).toBe(true);
    expect(consoleOutput.some(line => line.includes('#Button'))).toBe(true);
    expect(consoleOutput.some(line => line.includes('src/components/Button.tsx'))).toBe(true);
  });

  it('should show file metadata when resolving', () => {
    testCommand(state, '#Button');

    expect(consoleOutput.some(line => line.includes('Type:'))).toBe(true);
    expect(consoleOutput.some(line => line.includes('Lines:'))).toBe(true);
    expect(consoleOutput.some(line => line.includes('Exports:'))).toBe(true);
    expect(consoleOutput.some(line => line.includes('Button, ButtonProps'))).toBe(true);
  });

  it('should resolve nested file reference', () => {
    testCommand(state, '.src.components.forms#LoginForm');

    expect(consoleOutput.some(line => line.includes('resolved successfully'))).toBe(true);
    expect(consoleOutput.some(line => line.includes('src/components/forms/LoginForm.tsx'))).toBe(true);
  });

  it('should show error for non-existent reference', () => {
    testCommand(state, '#NonExistent');

    expect(consoleOutput.some(line => line.includes('Could not resolve'))).toBe(true);
    expect(consoleOutput.some(line => line.includes('TAB completion'))).toBe(true);
  });

  it('should show error for invalid folder path', () => {
    testCommand(state, '.invalid.path#Button');

    expect(consoleOutput.some(line => line.includes('Could not resolve'))).toBe(true);
  });

  it('should handle file without exports gracefully', () => {
    // Add a file with no exports to the mock
    const mapWithNoExports: ProjectMap = {
      ...state.projectMap!,
      structure: {
        src: {
          'utils.tsx': {
            path: 'src/utils.tsx',
            type: 'utility',
            lines: 20,
            exports: [],
            imports: [],
            usedBy: []
          }
        }
      },
      files: ['src/utils.tsx'],
      components: []
    };

    state.setProjectMap(mapWithNoExports);
    testCommand(state, '#utils');

    // Should still resolve but not show exports line
    const exportsLine = consoleOutput.find(line => line.includes('Exports:'));
    expect(exportsLine).toBeUndefined();
  });
});
