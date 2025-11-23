import { describe, it, expect, beforeEach } from '@jest/globals';
import { REPLState, ProjectMap } from '../repl/state.js';
import { AutoCompleter } from '../core/autocomplete.js';

/**
 * Tests for readline completer function behavior
 * Verifies that tab completion only replaces the token being completed,
 * not the entire line
 */
describe('REPL Completer Token Extraction', () => {
  let state: REPLState;
  let autocompleter: AutoCompleter;

  beforeEach(async () => {
    state = new REPLState();

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
              exports: ['Button'],
              imports: [],
              usedBy: []
            }
          }
        }
      },
      files: ['src/components/Button.tsx'],
      components: ['Button']
    };

    await state.setProjectMap(mockProjectMap);
    autocompleter = new AutoCompleter(state);
  });

  // Simulate the completer function from repl.ts
  const completer = (line: string): [string[], string] => {
    // Find the token being completed
    const templateMatch = line.match(/@([a-zA-Z0-9:-]*)$/);
    const fileMatch = line.match(/#([a-zA-Z0-9_-]*)$/);
    const folderMatch = line.match(/\.([a-zA-Z0-9._/-]*)$/);

    let token = '';
    if (templateMatch) {
      token = templateMatch[0];
    } else if (fileMatch) {
      token = fileMatch[0];
    } else if (folderMatch) {
      token = folderMatch[0];
    }

    if (token) {
      const completions = autocompleter.complete(line, line.length);
      return [completions, token];
    }

    return [[], ''];
  };

  describe('Token extraction for file references', () => {
    it('should extract token from "/info #But"', () => {
      const [completions, token] = completer('/info #But');

      expect(token).toBe('#But');
      expect(completions).toContain('#Button');
    });

    it('should extract token from "/test #Button"', () => {
      const [completions, token] = completer('/test #Button');

      expect(token).toBe('#Button');
    });

    it('should extract token from "some command #B"', () => {
      const [completions, token] = completer('some command #B');

      expect(token).toBe('#B');
    });

    it('should extract token from just "#"', () => {
      const [completions, token] = completer('#');

      expect(token).toBe('#');
    });
  });

  describe('Token extraction for folder references', () => {
    it('should extract token from "/info .src"', () => {
      const [completions, token] = completer('/info .src');

      expect(token).toBe('.src');
    });

    it('should extract token from "/test .src.comp"', () => {
      const [completions, token] = completer('/test .src.comp');

      expect(token).toBe('.src.comp');
    });

    it('should extract token from "command .src.components.forms"', () => {
      const [completions, token] = completer('command .src.components.forms');

      expect(token).toBe('.src.components.forms');
    });
  });

  describe('Token extraction for template references', () => {
    it('should extract token from "/generate @form"', () => {
      const [completions, token] = completer('/generate @form');

      expect(token).toBe('@form');
    });

    it('should extract token from "@button:pr"', () => {
      const [completions, token] = completer('@button:pr');

      expect(token).toBe('@button:pr');
    });

    it('should extract token from "create component @card:simple"', () => {
      const [completions, token] = completer('create component @card:simple');

      expect(token).toBe('@card:simple');
    });
  });

  describe('No token scenarios', () => {
    it('should return empty for regular text', () => {
      const [completions, token] = completer('/info Button');

      expect(token).toBe('');
      expect(completions).toHaveLength(0);
    });

    it('should return empty for command only', () => {
      const [completions, token] = completer('/list');

      expect(token).toBe('');
      expect(completions).toHaveLength(0);
    });

    it('should return empty for empty string', () => {
      const [completions, token] = completer('');

      expect(token).toBe('');
      expect(completions).toHaveLength(0);
    });
  });

  describe('Expected readline behavior', () => {
    it('should preserve command prefix when completing file reference', () => {
      const line = '/info #But';
      const [completions, token] = completer(line);

      // Token is what gets replaced
      expect(token).toBe('#But');

      // If completion is '#Button', readline will replace '#But' with '#Button'
      // Result: '/info #Button'
      const expectedResult = line.replace(token, '#Button');
      expect(expectedResult).toBe('/info #Button');
    });

    it('should preserve command prefix when completing folder reference', () => {
      const line = '/test .src.comp';
      const [completions, token] = completer(line);

      expect(token).toBe('.src.comp');

      // If completion is '.src.components', readline replaces '.src.comp' with '.src.components'
      const expectedResult = line.replace(token, '.src.components');
      expect(expectedResult).toBe('/test .src.components');
    });

    it('should preserve command prefix when completing template', () => {
      const line = '/generate @form:log';
      const [completions, token] = completer(line);

      expect(token).toBe('@form:log');

      const expectedResult = line.replace(token, '@form:login');
      expect(expectedResult).toBe('/generate @form:login');
    });
  });

  describe('Edge cases', () => {
    it('should handle multiple special characters', () => {
      const [completions, token] = completer('/info .src.components#Button');

      // Should match the file reference at the end
      expect(token).toBe('#Button');
    });

    it('should handle special characters mid-line', () => {
      const line = 'text #ref more text';
      const [completions, token] = completer(line);

      // Should only match at end of line
      expect(token).toBe('');
    });

    it('should handle nested dots in folder path', () => {
      const [completions, token] = completer('.src.components.forms.auth');

      expect(token).toBe('.src.components.forms.auth');
    });
  });
});
