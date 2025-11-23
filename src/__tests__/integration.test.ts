import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { REPLState, ProjectMap } from '../repl/state.js';
import { AutoCompleter } from '../core/autocomplete.js';
import { initCommand } from '../commands/init.js';
import { testCommand } from '../commands/test.js';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';

/**
 * Integration tests - Test multiple components working together
 * These tests verify the full workflow without interactive terminal I/O
 */

describe('Integration Tests', () => {
  let tempDir: string;
  let state: REPLState;
  let autocompleter: AutoCompleter;
  const originalCwd = process.cwd;

  beforeEach(async () => {
    // Create a temporary React project
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'reactgen-integration-'));

    // Mock process.cwd to return temp directory
    process.cwd = () => tempDir;

    state = new REPLState();
    autocompleter = new AutoCompleter(state);
  });

  afterEach(async () => {
    await fs.rm(tempDir, { recursive: true, force: true });
    process.cwd = originalCwd;
  });

  describe('End-to-End: Init → Autocomplete → Test', () => {
    it('should complete full workflow from init to reference resolution', async () => {
      // Setup: Create a mock React project
      await fs.writeFile(
        path.join(tempDir, 'package.json'),
        JSON.stringify({ name: 'test-integration-project' })
      );

      const componentsDir = path.join(tempDir, 'src', 'components');
      await fs.mkdir(componentsDir, { recursive: true });

      await fs.writeFile(
        path.join(componentsDir, 'Button.tsx'),
        'export const Button = () => <button>Click</button>;'
      );

      await fs.writeFile(
        path.join(componentsDir, 'Input.tsx'),
        'export const Input = () => <input />;'
      );

      const formsDir = path.join(componentsDir, 'forms');
      await fs.mkdir(formsDir, { recursive: true });

      await fs.writeFile(
        path.join(formsDir, 'LoginForm.tsx'),
        'export const LoginForm = () => <form>Login</form>;'
      );

      // Step 1: Initialize project
      await initCommand(state, false);

      expect(state.isInitialized).toBe(true);
      expect(state.projectMap).not.toBeNull();
      expect(state.getFiles()).toHaveLength(3);
      expect(state.getComponents()).toContain('Button');
      expect(state.getComponents()).toContain('Input');
      expect(state.getComponents()).toContain('LoginForm');

      // Step 2: Test file reference autocomplete
      const fileCompletions = autocompleter.complete('#But', 4);
      expect(fileCompletions).toContain('#Button');

      // Step 3: Test folder reference autocomplete
      const folderCompletions = autocompleter.complete('.src.comp', 9);
      expect(folderCompletions).toContain('.src.components');

      // Step 4: Test nested folder autocomplete
      const nestedCompletions = autocompleter.complete('.src.components.', 16);
      expect(nestedCompletions).toContain('.src.components.forms');

      // Step 5: Test template autocomplete
      const templateCompletions = autocompleter.complete('@form', 5);
      expect(templateCompletions.length).toBeGreaterThan(0);
      expect(templateCompletions.some(c => c.includes('form:login'))).toBe(true);

      // Step 6: Test reference resolution
      const buttonPath = autocompleter.resolveReference('#Button');
      expect(buttonPath).toBe('src/components/Button.tsx');

      const loginPath = autocompleter.resolveReference('.src.components.forms#LoginForm');
      expect(loginPath).toBe('src/components/forms/LoginForm.tsx');

      // Step 7: Test invalid reference
      const invalidPath = autocompleter.resolveReference('#NonExistent');
      expect(invalidPath).toBeNull();
    });

    it('should handle cache and forced rescan', async () => {
      // Setup project
      await fs.writeFile(
        path.join(tempDir, 'package.json'),
        JSON.stringify({ name: 'cache-test' })
      );

      const srcDir = path.join(tempDir, 'src');
      await fs.mkdir(srcDir, { recursive: true });

      await fs.writeFile(
        path.join(srcDir, 'App.tsx'),
        'export const App = () => <div>App</div>;'
      );

      // First init
      await initCommand(state, false);
      expect(state.getFiles()).toHaveLength(1);

      // Create second state (simulating new session)
      const state2 = new REPLState();

      // Second init should use cache
      await initCommand(state2, false);
      expect(state2.getFiles()).toHaveLength(1);

      // Add new file
      await fs.writeFile(
        path.join(srcDir, 'Button.tsx'),
        'export const Button = () => <button>Click</button>;'
      );

      // Init without force should still use cache
      const state3 = new REPLState();
      await initCommand(state3, false);
      expect(state3.getFiles()).toHaveLength(1); // Still cached

      // Init with force should rescan
      const state4 = new REPLState();
      await initCommand(state4, true);
      expect(state4.getFiles()).toHaveLength(2); // New file found
    });
  });

  describe('Autocomplete Integration', () => {
    beforeEach(async () => {
      // Create project structure for autocomplete tests
      await fs.writeFile(
        path.join(tempDir, 'package.json'),
        JSON.stringify({ name: 'autocomplete-test' })
      );

      const structure = {
        'src/components': ['Button.tsx', 'Input.tsx', 'Header.tsx'],
        'src/components/forms': ['LoginForm.tsx', 'SignupForm.tsx'],
        'src/pages': ['Home.tsx', 'About.tsx'],
        'app': ['page.tsx', 'layout.tsx']
      };

      for (const [dir, files] of Object.entries(structure)) {
        const fullDir = path.join(tempDir, dir);
        await fs.mkdir(fullDir, { recursive: true });

        for (const file of files) {
          const componentName = file.replace('.tsx', '');
          await fs.writeFile(
            path.join(fullDir, file),
            `export const ${componentName} = () => <div>${componentName}</div>;`
          );
        }
      }

      await initCommand(state, false);
    });

    it('should complete files across entire project', () => {
      const completions = autocompleter.complete('#', 1);

      expect(completions).toContain('#Button');
      expect(completions).toContain('#LoginForm');
      expect(completions).toContain('#Home');
      expect(completions).toContain('#page');
    });

    it('should filter completions by prefix', () => {
      const completions = autocompleter.complete('#Log', 4);

      expect(completions).toContain('#LoginForm');
      expect(completions).not.toContain('#Button');
      expect(completions).not.toContain('#SignupForm');
    });

    it('should complete nested folder paths', () => {
      const level1 = autocompleter.complete('.', 1);
      expect(level1).toContain('.src');
      expect(level1).toContain('.app');

      const level2 = autocompleter.complete('.src.', 5);
      expect(level2).toContain('.src.components');
      expect(level2).toContain('.src.pages');

      const level3 = autocompleter.complete('.src.components.', 16);
      expect(level3).toContain('.src.components.forms');
    });

    it('should resolve references with folder paths', () => {
      expect(autocompleter.resolveReference('#Button'))
        .toBe('src/components/Button.tsx');

      expect(autocompleter.resolveReference('.src.components#Button'))
        .toBe('src/components/Button.tsx');

      expect(autocompleter.resolveReference('.src.components.forms#LoginForm'))
        .toBe('src/components/forms/LoginForm.tsx');

      expect(autocompleter.resolveReference('.app#page'))
        .toBe('app/page.tsx');
    });

    it('should handle ambiguous file names correctly', () => {
      // When same filename exists in multiple folders,
      // simple reference should find first match
      const path1 = autocompleter.resolveReference('#page');
      expect(path1).toBe('app/page.tsx');

      // Folder-qualified reference should find specific file
      const path2 = autocompleter.resolveReference('.app#page');
      expect(path2).toBe('app/page.tsx');
    });
  });

  describe('Template Integration', () => {
    it('should complete all template categories', () => {
      // Forms
      const forms = autocompleter.complete('@form', 5);
      expect(forms).toContain('@form:login');
      expect(forms).toContain('@form:signup');

      // Buttons
      const buttons = autocompleter.complete('@button', 7);
      expect(buttons).toContain('@button:primary');
      expect(buttons).toContain('@button:secondary');

      // Cards
      const cards = autocompleter.complete('@card', 5);
      expect(cards).toContain('@card:simple');
      expect(cards).toContain('@card:product');

      // Modals
      const modals = autocompleter.complete('@modal', 6);
      expect(modals).toContain('@modal:confirm');
      expect(modals).toContain('@modal:info');

      // Navigation
      const nav = autocompleter.complete('@nav', 4);
      expect(nav).toContain('@nav:header');
      expect(nav).toContain('@nav:sidebar');
    });

    it('should return all templates with @ prefix alone', () => {
      const all = autocompleter.complete('@', 1);

      expect(all.length).toBeGreaterThan(15);
      expect(all.every(t => t.startsWith('@'))).toBe(true);
    });
  });

  describe('Error Handling Integration', () => {
    it('should gracefully handle uninitialized state', () => {
      const uninitializedState = new REPLState();
      const uninitializedCompleter = new AutoCompleter(uninitializedState);

      expect(uninitializedCompleter.complete('#Button', 7)).toHaveLength(0);
      expect(uninitializedCompleter.complete('.src', 4)).toHaveLength(0);
      expect(uninitializedCompleter.resolveReference('#Button')).toBeNull();
    });

    it('should handle corrupted project structure', async () => {
      // Create minimal project
      await fs.writeFile(
        path.join(tempDir, 'package.json'),
        JSON.stringify({ name: 'test' })
      );

      await initCommand(state, false);

      // Manually corrupt the structure
      if (state.projectMap) {
        state.projectMap.structure = {};
      }

      // Should not crash
      expect(() => {
        autocompleter.complete('.src', 4);
        autocompleter.resolveReference('#Button');
      }).not.toThrow();
    });
  });

  describe('Multi-Step Workflows', () => {
    it('should support typical user workflow', async () => {
      // User workflow: Init → List → Autocomplete → Test

      // Setup project
      await fs.writeFile(
        path.join(tempDir, 'package.json'),
        JSON.stringify({ name: 'workflow-test' })
      );

      const componentsDir = path.join(tempDir, 'src', 'components');
      await fs.mkdir(componentsDir, { recursive: true });

      await fs.writeFile(
        path.join(componentsDir, 'Button.tsx'),
        'export const Button = () => <button>Click</button>;'
      );

      // Step 1: User runs /init
      await initCommand(state, false);
      expect(state.isInitialized).toBe(true);

      // Step 2: User types #B and presses TAB
      const completions = autocompleter.complete('#B', 2);
      expect(completions).toContain('#Button');

      // Step 3: User runs /test #Button
      const resolved = autocompleter.resolveReference('#Button');
      expect(resolved).toBe('src/components/Button.tsx');

      // Step 4: User can get file metadata
      const fileInfo = state.projectMap?.structure.src.components['Button.tsx'];
      expect(fileInfo).toBeDefined();
      expect(fileInfo.exports).toContain('Button');
    });
  });
});
