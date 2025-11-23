import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { REPLState } from '../repl/state.js';
import type { ProjectMap } from '../core/mapper.js';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';

describe('REPLState', () => {
  let state: REPLState;

  beforeEach(() => {
    state = new REPLState();
  });

  describe('initialization', () => {
    it('should start with no project root', () => {
      expect(state.projectRoot).toBeNull();
    });

    it('should require initialization by default', () => {
      expect(state.requiresInit()).toBe(true);
    });
  });

  describe('setProjectMap', () => {
    it('should store project map', () => {
      const projectMap: ProjectMap = {
        version: '1.0',
        scannedAt: new Date().toISOString(),
        rootDir: '/test/project',
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

      expect(state.requiresInit()).toBe(false);
    });

    it('should allow retrieving components', () => {
      const projectMap: ProjectMap = {
        version: '1.0',
        scannedAt: new Date().toISOString(),
        rootDir: '/test',
        structure: {},
        files: [],
        components: ['Button', 'Input', 'Header']
      };

      state.setProjectMap(projectMap);

      const components = state.getComponents();
      expect(components).toEqual(['Button', 'Input', 'Header']);
    });

    it('should allow retrieving files', () => {
      const projectMap: ProjectMap = {
        version: '1.0',
        scannedAt: new Date().toISOString(),
        rootDir: '/test',
        structure: {},
        files: ['src/App.tsx', 'src/Button.tsx'],
        components: []
      };

      state.setProjectMap(projectMap);

      const files = state.getFiles();
      expect(files).toEqual(['src/App.tsx', 'src/Button.tsx']);
    });
  });

  describe('requiresInit', () => {
    it('should return true when no project map is set', () => {
      expect(state.requiresInit()).toBe(true);
    });

    it('should return false after setting project map', () => {
      const projectMap: ProjectMap = {
        version: '1.0',
        scannedAt: new Date().toISOString(),
        rootDir: '/test',
        structure: {},
        files: [],
        components: []
      };

      state.setProjectMap(projectMap);

      expect(state.requiresInit()).toBe(false);
    });
  });

  describe('getComponents', () => {
    it('should return empty array when not initialized', () => {
      const components = state.getComponents();
      expect(components).toEqual([]);
    });

    it('should return components from project map', () => {
      const projectMap: ProjectMap = {
        version: '1.0',
        scannedAt: new Date().toISOString(),
        rootDir: '/test',
        structure: {},
        files: [],
        components: ['ComponentA', 'ComponentB']
      };

      state.setProjectMap(projectMap);

      expect(state.getComponents()).toEqual(['ComponentA', 'ComponentB']);
    });
  });

  describe('getFiles', () => {
    it('should return empty array when not initialized', () => {
      const files = state.getFiles();
      expect(files).toEqual([]);
    });

    it('should return files from project map', () => {
      const projectMap: ProjectMap = {
        version: '1.0',
        scannedAt: new Date().toISOString(),
        rootDir: '/test',
        structure: {},
        files: ['src/App.tsx', 'components/Button.tsx'],
        components: []
      };

      state.setProjectMap(projectMap);

      expect(state.getFiles()).toEqual(['src/App.tsx', 'components/Button.tsx']);
    });
  });

  describe('projectRoot', () => {
    it('should allow setting project root', () => {
      state.projectRoot = '/my/project';
      expect(state.projectRoot).toBe('/my/project');
    });

    it('should allow updating project root', () => {
      state.projectRoot = '/first/path';
      state.projectRoot = '/second/path';
      expect(state.projectRoot).toBe('/second/path');
    });
  });

  describe('projectName extraction', () => {
    let tempDir: string;

    beforeEach(async () => {
      // Create a temporary directory for testing
      tempDir = path.join(os.tmpdir(), `reactgen-test-${Date.now()}`);
      await fs.mkdir(tempDir, { recursive: true });
    });

    afterEach(async () => {
      // Clean up temporary directory
      try {
        await fs.rm(tempDir, { recursive: true, force: true });
      } catch {
        // Ignore cleanup errors
      }
    });

    it('should extract project name from package.json', async () => {
      const pkgJson = {
        name: 'my-awesome-app',
        version: '1.0.0'
      };

      await fs.writeFile(
        path.join(tempDir, 'package.json'),
        JSON.stringify(pkgJson)
      );

      const projectMap: ProjectMap = {
        version: '1.0',
        scannedAt: new Date().toISOString(),
        rootDir: tempDir,
        structure: {},
        files: [],
        components: []
      };

      await state.setProjectMap(projectMap);

      expect(state.projectName).toBe('my-awesome-app');
    });

    it('should handle missing package.json gracefully', async () => {
      const projectMap: ProjectMap = {
        version: '1.0',
        scannedAt: new Date().toISOString(),
        rootDir: tempDir,
        structure: {},
        files: [],
        components: []
      };

      await state.setProjectMap(projectMap);

      expect(state.projectName).toBeNull();
    });

    it('should handle package.json without name field', async () => {
      const pkgJson = {
        version: '1.0.0',
        dependencies: {}
      };

      await fs.writeFile(
        path.join(tempDir, 'package.json'),
        JSON.stringify(pkgJson)
      );

      const projectMap: ProjectMap = {
        version: '1.0',
        scannedAt: new Date().toISOString(),
        rootDir: tempDir,
        structure: {},
        files: [],
        components: []
      };

      await state.setProjectMap(projectMap);

      expect(state.projectName).toBeNull();
    });

    it('should handle malformed package.json', async () => {
      await fs.writeFile(
        path.join(tempDir, 'package.json'),
        'invalid json {'
      );

      const projectMap: ProjectMap = {
        version: '1.0',
        scannedAt: new Date().toISOString(),
        rootDir: tempDir,
        structure: {},
        files: [],
        components: []
      };

      await state.setProjectMap(projectMap);

      expect(state.projectName).toBeNull();
    });

    it('should extract scoped package names', async () => {
      const pkgJson = {
        name: '@myorg/my-package',
        version: '2.1.0'
      };

      await fs.writeFile(
        path.join(tempDir, 'package.json'),
        JSON.stringify(pkgJson)
      );

      const projectMap: ProjectMap = {
        version: '1.0',
        scannedAt: new Date().toISOString(),
        rootDir: tempDir,
        structure: {},
        files: [],
        components: []
      };

      await state.setProjectMap(projectMap);

      expect(state.projectName).toBe('@myorg/my-package');
    });
  });
});
