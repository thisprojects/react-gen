import { describe, it, expect, beforeEach } from '@jest/globals';
import { AutoCompleter } from '../core/autocomplete.js';
import { REPLState, ProjectMap } from '../repl/state.js';

describe('AutoCompleter', () => {
  let state: REPLState;
  let autocompleter: AutoCompleter;

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
              },
              'SignupForm.tsx': {
                path: 'src/components/forms/SignupForm.tsx',
                type: 'component',
                lines: 120,
                exports: ['SignupForm'],
                imports: [],
                usedBy: []
              }
            }
          },
          'App.tsx': {
            path: 'src/App.tsx',
            type: 'component',
            lines: 80,
            exports: ['App'],
            imports: [],
            usedBy: []
          }
        },
        app: {
          'page.tsx': {
            path: 'app/page.tsx',
            type: 'component',
            lines: 40,
            exports: ['default'],
            imports: [],
            usedBy: []
          }
        }
      },
      files: [
        'src/components/Button.tsx',
        'src/components/Input.tsx',
        'src/components/forms/LoginForm.tsx',
        'src/components/forms/SignupForm.tsx',
        'src/App.tsx',
        'app/page.tsx'
      ],
      components: ['Button', 'Input', 'LoginForm', 'SignupForm', 'App']
    };

    await state.setProjectMap(mockProjectMap);
    autocompleter = new AutoCompleter(state);
  });

  describe('template completion', () => {
    it('should complete template references with @', () => {
      const completions = autocompleter.complete('@form', 5);

      expect(completions).toContain('@form:login');
      expect(completions).toContain('@form:signup');
      expect(completions).toContain('@form:contact');
      expect(completions).toContain('@form:search');
    });

    it('should complete button templates', () => {
      const completions = autocompleter.complete('@button', 7);

      expect(completions).toContain('@button:primary');
      expect(completions).toContain('@button:secondary');
      expect(completions).toContain('@button:ghost');
    });

    it('should complete card templates', () => {
      const completions = autocompleter.complete('@card', 5);

      expect(completions).toContain('@card:simple');
      expect(completions).toContain('@card:product');
      expect(completions).toContain('@card:user');
    });

    it('should return all templates when @ is typed alone', () => {
      const completions = autocompleter.complete('@', 1);

      expect(completions.length).toBeGreaterThan(10);
      expect(completions.every(c => c.startsWith('@'))).toBe(true);
    });
  });

  describe('file completion', () => {
    it('should complete file references with #', () => {
      const completions = autocompleter.complete('#But', 4);

      expect(completions).toContain('#Button');
    });

    it('should complete multiple matching files', () => {
      const completions = autocompleter.complete('#', 1);

      expect(completions).toContain('#Button');
      expect(completions).toContain('#Input');
      expect(completions).toContain('#LoginForm');
      expect(completions).toContain('#SignupForm');
      expect(completions).toContain('#App');
    });

    it('should filter files by partial name', () => {
      const completions = autocompleter.complete('#Log', 4);

      expect(completions).toContain('#LoginForm');
      expect(completions).not.toContain('#Button');
      expect(completions).not.toContain('#SignupForm');
    });

    it('should be case insensitive', () => {
      const completions = autocompleter.complete('#but', 4);

      expect(completions).toContain('#Button');
    });

    it('should remove duplicates', () => {
      const completions = autocompleter.complete('#', 1);
      const unique = new Set(completions);

      expect(completions.length).toBe(unique.size);
    });
  });

  describe('folder completion', () => {
    it('should complete top-level folders', () => {
      const completions = autocompleter.complete('.src', 4);

      expect(completions).toContain('.src');
    });

    it('should complete nested folders', () => {
      const completions = autocompleter.complete('.src.comp', 9);

      expect(completions).toContain('.src.components');
    });

    it('should complete deeply nested folders', () => {
      const completions = autocompleter.complete('.src.components.', 16);

      expect(completions).toContain('.src.components.forms');
    });

    it('should filter folders by partial name', () => {
      const completions = autocompleter.complete('.ap', 3);

      expect(completions).toContain('.app');
      expect(completions).not.toContain('.src');
    });

    it('should handle invalid folder paths', () => {
      const completions = autocompleter.complete('.nonexistent.folder', 19);

      expect(completions).toHaveLength(0);
    });
  });

  describe('resolveReference', () => {
    it('should resolve simple file reference', () => {
      const path = autocompleter.resolveReference('#Button');

      expect(path).toBe('src/components/Button.tsx');
    });

    it('should resolve file reference with folder', () => {
      const path = autocompleter.resolveReference('.src.components#Button');

      expect(path).toBe('src/components/Button.tsx');
    });

    it('should resolve file in nested folder', () => {
      const path = autocompleter.resolveReference('.src.components.forms#LoginForm');

      expect(path).toBe('src/components/forms/LoginForm.tsx');
    });

    it('should return null for non-existent file', () => {
      const path = autocompleter.resolveReference('#NonExistent');

      expect(path).toBeNull();
    });

    it('should return null for invalid folder path', () => {
      const path = autocompleter.resolveReference('.invalid.path#Button');

      expect(path).toBeNull();
    });

    it('should return null for malformed reference', () => {
      const path = autocompleter.resolveReference('NotAReference');

      expect(path).toBeNull();
    });
  });

  describe('getFilesInFolder', () => {
    it('should get files in top-level folder', () => {
      const files = autocompleter.getFilesInFolder('src');

      expect(files).toContain('App');
    });

    it('should get files in nested folder', () => {
      const files = autocompleter.getFilesInFolder('src.components');

      expect(files).toContain('Button');
      expect(files).toContain('Input');
    });

    it('should get files in deeply nested folder', () => {
      const files = autocompleter.getFilesInFolder('src.components.forms');

      expect(files).toContain('LoginForm');
      expect(files).toContain('SignupForm');
    });

    it('should return empty array for non-existent folder', () => {
      const files = autocompleter.getFilesInFolder('nonexistent');

      expect(files).toHaveLength(0);
    });

    it('should return files without extensions', () => {
      const files = autocompleter.getFilesInFolder('src.components');

      expect(files.every(f => !f.includes('.'))).toBe(true);
    });
  });

  describe('integration scenarios', () => {
    it('should handle mixed command input', () => {
      // Typing: "generate @form"
      const completions = autocompleter.complete('generate @form', 14);

      expect(completions.length).toBeGreaterThan(0);
      expect(completions.every(c => c.startsWith('@form'))).toBe(true);
    });

    it('should complete at cursor position', () => {
      // Typing: "#But from components"
      // Cursor at position 4 (after "But")
      const completions = autocompleter.complete('#But from components', 4);

      expect(completions).toContain('#Button');
    });

    it('should return empty for no matches', () => {
      const completions = autocompleter.complete('#ZZZ', 4);

      expect(completions).toHaveLength(0);
    });
  });

  describe('edge cases', () => {
    it('should handle empty input', () => {
      const completions = autocompleter.complete('', 0);

      expect(completions).toHaveLength(0);
    });

    it('should handle input without special characters', () => {
      const completions = autocompleter.complete('regular text', 12);

      expect(completions).toHaveLength(0);
    });

    it('should handle uninitialized state', () => {
      const emptyState = new REPLState();
      const emptyAutocompleter = new AutoCompleter(emptyState);

      const completions = emptyAutocompleter.complete('#Button', 7);

      expect(completions).toHaveLength(0);
    });
  });
});
