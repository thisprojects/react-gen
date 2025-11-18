import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { infoCommand } from '../commands/info.js';
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

describe('infoCommand', () => {
  let state: REPLState;

  beforeEach(() => {
    state = new REPLState();
  });

  it('should show error when project not initialized', async () => {
    await infoCommand(state, 'App.tsx');

    expect(consoleOutput.some(line => line.includes('Project not initialized'))).toBe(true);
  });

  it('should show file information for existing file', async () => {
    const projectMap: ProjectMap = {
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
            imports: ['react'],
            usedBy: []
          }
        }
      },
      files: ['src/App.tsx'],
      components: ['App']
    };

    state.setProjectMap(projectMap);

    await infoCommand(state, 'App.tsx');

    expect(consoleOutput.some(line => line.includes('File: src/App.tsx'))).toBe(true);
    expect(consoleOutput.some(line => line.includes('Lines: 50'))).toBe(true);
    expect(consoleOutput.some(line => line.includes('Type: component'))).toBe(true);
    expect(consoleOutput.some(line => line.includes('Exports: App'))).toBe(true);
  });

  it('should show error when file not found', async () => {
    const projectMap: ProjectMap = {
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
    };

    state.setProjectMap(projectMap);

    await infoCommand(state, 'NonExistent.tsx');

    expect(consoleOutput.some(line => line.includes('File not found'))).toBe(true);
    expect(consoleOutput.some(line => line.includes('Try /list'))).toBe(true);
  });

  it('should match file by name without extension', async () => {
    const projectMap: ProjectMap = {
      version: '1.0',
      scannedAt: new Date().toISOString(),
      rootDir: '/test',
      structure: {
        src: {
          'Button.tsx': {
            path: 'src/Button.tsx',
            type: 'component',
            lines: 30,
            exports: ['Button'],
            imports: [],
            usedBy: []
          }
        }
      },
      files: ['src/Button.tsx'],
      components: ['Button']
    };

    state.setProjectMap(projectMap);

    await infoCommand(state, 'Button');

    expect(consoleOutput.some(line => line.includes('File: src/Button.tsx'))).toBe(true);
  });

  it('should display imports list', async () => {
    const projectMap: ProjectMap = {
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
            imports: ['react', 'react-router-dom', './styles.css'],
            usedBy: []
          }
        }
      },
      files: ['src/App.tsx'],
      components: ['App']
    };

    state.setProjectMap(projectMap);

    await infoCommand(state, 'App.tsx');

    expect(consoleOutput.some(line => line.includes('Imports:'))).toBe(true);
    expect(consoleOutput.some(line => line.includes('react'))).toBe(true);
    expect(consoleOutput.some(line => line.includes('react-router-dom'))).toBe(true);
    expect(consoleOutput.some(line => line.includes('./styles.css'))).toBe(true);
  });

  it('should display multiple exports', async () => {
    const projectMap: ProjectMap = {
      version: '1.0',
      scannedAt: new Date().toISOString(),
      rootDir: '/test',
      structure: {
        src: {
          'Components.tsx': {
            path: 'src/Components.tsx',
            type: 'component',
            lines: 100,
            exports: ['Button', 'Input', 'Select'],
            imports: [],
            usedBy: []
          }
        }
      },
      files: ['src/Components.tsx'],
      components: ['Button', 'Input', 'Select']
    };

    state.setProjectMap(projectMap);

    await infoCommand(state, 'Components.tsx');

    expect(consoleOutput.some(line => line.includes('Exports: Button, Input, Select'))).toBe(true);
  });

  it('should not show exports section for files with no exports', async () => {
    const projectMap: ProjectMap = {
      version: '1.0',
      scannedAt: new Date().toISOString(),
      rootDir: '/test',
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

    state.setProjectMap(projectMap);

    await infoCommand(state, 'utils.tsx');

    expect(consoleOutput.some(line => line.includes('Exports:'))).toBe(false);
  });

  it('should not show imports section for files with no imports', async () => {
    const projectMap: ProjectMap = {
      version: '1.0',
      scannedAt: new Date().toISOString(),
      rootDir: '/test',
      structure: {
        src: {
          'Simple.tsx': {
            path: 'src/Simple.tsx',
            type: 'component',
            lines: 5,
            exports: ['Simple'],
            imports: [],
            usedBy: []
          }
        }
      },
      files: ['src/Simple.tsx'],
      components: ['Simple']
    };

    state.setProjectMap(projectMap);

    await infoCommand(state, 'Simple.tsx');

    expect(consoleOutput.some(line => line.includes('Imports:'))).toBe(false);
  });

  it('should find files in nested directories', async () => {
    const projectMap: ProjectMap = {
      version: '1.0',
      scannedAt: new Date().toISOString(),
      rootDir: '/test',
      structure: {
        src: {
          features: {
            auth: {
              components: {
                'LoginForm.tsx': {
                  path: 'src/features/auth/components/LoginForm.tsx',
                  type: 'component',
                  lines: 75,
                  exports: ['LoginForm'],
                  imports: ['react', 'react-hook-form'],
                  usedBy: []
                }
              }
            }
          }
        }
      },
      files: ['src/features/auth/components/LoginForm.tsx'],
      components: ['LoginForm']
    };

    state.setProjectMap(projectMap);

    await infoCommand(state, 'LoginForm.tsx');

    expect(consoleOutput.some(line => line.includes('File: src/features/auth/components/LoginForm.tsx'))).toBe(true);
  });

  it('should display test file type', async () => {
    const projectMap: ProjectMap = {
      version: '1.0',
      scannedAt: new Date().toISOString(),
      rootDir: '/test',
      structure: {
        src: {
          'Button.test.tsx': {
            path: 'src/Button.test.tsx',
            type: 'test',
            lines: 50,
            exports: ['testHelper'],
            imports: ['@testing-library/react'],
            usedBy: []
          }
        }
      },
      files: ['src/Button.test.tsx'],
      components: []
    };

    state.setProjectMap(projectMap);

    await infoCommand(state, 'Button.test.tsx');

    expect(consoleOutput.some(line => line.includes('Type: test'))).toBe(true);
  });

  it('should handle .jsx files', async () => {
    const projectMap: ProjectMap = {
      version: '1.0',
      scannedAt: new Date().toISOString(),
      rootDir: '/test',
      structure: {
        src: {
          'Legacy.jsx': {
            path: 'src/Legacy.jsx',
            type: 'component',
            lines: 40,
            exports: ['Legacy'],
            imports: ['react'],
            usedBy: []
          }
        }
      },
      files: ['src/Legacy.jsx'],
      components: ['Legacy']
    };

    state.setProjectMap(projectMap);

    await infoCommand(state, 'Legacy.jsx');

    expect(consoleOutput.some(line => line.includes('File: src/Legacy.jsx'))).toBe(true);
  });

  it('should match file without .jsx extension', async () => {
    const projectMap: ProjectMap = {
      version: '1.0',
      scannedAt: new Date().toISOString(),
      rootDir: '/test',
      structure: {
        src: {
          'Component.jsx': {
            path: 'src/Component.jsx',
            type: 'component',
            lines: 30,
            exports: ['Component'],
            imports: [],
            usedBy: []
          }
        }
      },
      files: ['src/Component.jsx'],
      components: ['Component']
    };

    state.setProjectMap(projectMap);

    await infoCommand(state, 'Component');

    expect(consoleOutput.some(line => line.includes('File: src/Component.jsx'))).toBe(true);
  });

  it('should display usedBy information when available', async () => {
    const projectMap: ProjectMap = {
      version: '1.0',
      scannedAt: new Date().toISOString(),
      rootDir: '/test',
      structure: {
        src: {
          'Button.tsx': {
            path: 'src/Button.tsx',
            type: 'component',
            lines: 30,
            exports: ['Button'],
            imports: [],
            usedBy: ['src/App.tsx', 'src/Dashboard.tsx']
          }
        }
      },
      files: ['src/Button.tsx'],
      components: ['Button']
    };

    state.setProjectMap(projectMap);

    await infoCommand(state, 'Button.tsx');

    expect(consoleOutput.some(line => line.includes('Used by (2):'))).toBe(true);
    expect(consoleOutput.some(line => line.includes('src/App.tsx'))).toBe(true);
    expect(consoleOutput.some(line => line.includes('src/Dashboard.tsx'))).toBe(true);
  });

  it('should not show usedBy section when empty', async () => {
    const projectMap: ProjectMap = {
      version: '1.0',
      scannedAt: new Date().toISOString(),
      rootDir: '/test',
      structure: {
        src: {
          'Unused.tsx': {
            path: 'src/Unused.tsx',
            type: 'component',
            lines: 20,
            exports: ['Unused'],
            imports: [],
            usedBy: []
          }
        }
      },
      files: ['src/Unused.tsx'],
      components: ['Unused']
    };

    state.setProjectMap(projectMap);

    await infoCommand(state, 'Unused.tsx');

    expect(consoleOutput.some(line => line.includes('Used by'))).toBe(false);
  });
});
