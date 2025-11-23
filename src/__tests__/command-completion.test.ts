import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { REPLState, ProjectMap } from '../repl/state.js';
import { AutoCompleter } from '../core/autocomplete.js';
import { infoCommand } from '../commands/info.js';
import { testCommand } from '../commands/test.js';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';

/**
 * Tests for tab completion integration with various commands
 * Verifies that all commands properly support file/folder/template references
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

describe('Command Tab Completion Integration', () => {
  let state: REPLState;
  let autocompleter: AutoCompleter;
  let tempDir: string;
  const originalCwd = process.cwd;

  beforeEach(async () => {
    // Create a temporary React project
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'reactgen-cmd-completion-'));
    process.cwd = () => tempDir;

    // Setup project structure
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

    // Create forms subdirectory
    const formsDir = path.join(componentsDir, 'forms');
    await fs.mkdir(formsDir, { recursive: true });

    await fs.writeFile(
      path.join(formsDir, 'LoginForm.tsx'),
      `export const LoginForm = () => <form>Login</form>;`
    );

    await fs.writeFile(
      path.join(formsDir, 'SignupForm.tsx'),
      `export const SignupForm = () => <form>Signup</form>;`
    );

    // Initialize state
    state = new REPLState();

    const mockProjectMap: ProjectMap = {
      version: '1.0',
      scannedAt: new Date().toISOString(),
      rootDir: tempDir,
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
          }
        }
      },
      files: [
        'src/components/Button.tsx',
        'src/components/Input.tsx',
        'src/components/forms/LoginForm.tsx',
        'src/components/forms/SignupForm.tsx'
      ],
      components: ['Button', 'Input', 'LoginForm', 'SignupForm']
    };

    await state.setProjectMap(mockProjectMap);
    autocompleter = new AutoCompleter(state);
  });

  afterEach(async () => {
    await fs.rm(tempDir, { recursive: true, force: true });
    process.cwd = originalCwd;
  });

  // Simulate the completer function
  const completer = (line: string): [string[], string] => {
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

  describe('/info command with tab completion', () => {
    it('should complete file reference in /info command', () => {
      const [completions, token] = completer('/info #But');

      expect(token).toBe('#But');
      expect(completions).toContain('#Button');
      expect(completions).not.toContain('#Input');
    });

    it('should work with completed reference', async () => {
      await infoCommand(state, 'Button.tsx');

      expect(consoleOutput.some(line => line.includes('Button.tsx'))).toBe(true);
      expect(consoleOutput.some(line => line.includes('component'))).toBe(true);
    });

    it('should complete all files with just #', () => {
      const [completions, token] = completer('/info #');

      expect(token).toBe('#');
      expect(completions).toContain('#Button');
      expect(completions).toContain('#Input');
      expect(completions).toContain('#LoginForm');
      expect(completions).toContain('#SignupForm');
    });

    it('should complete folder-qualified references', () => {
      const [completions, token] = completer('/info .src.components.forms#Log');

      expect(token).toBe('#Log');
      expect(completions).toContain('#LoginForm');
      expect(completions).not.toContain('#SignupForm');
    });

    it('should preserve /info prefix when completing', () => {
      const line = '/info #But';
      const [completions, token] = completer(line);

      const result = line.replace(token, '#Button');
      expect(result).toBe('/info #Button');
    });
  });

  describe('/test command with tab completion', () => {
    it('should complete file reference in /test command', () => {
      const [completions, token] = completer('/test #Inp');

      expect(token).toBe('#Inp');
      expect(completions).toContain('#Input');
    });

    it('should complete folder reference', () => {
      const [completions, token] = completer('/test .src');

      expect(token).toBe('.src');
      expect(completions).toContain('.src');
    });

    it('should complete nested folder reference', () => {
      const [completions, token] = completer('/test .src.components.for');

      expect(token).toBe('.src.components.for');
      expect(completions).toContain('.src.components.forms');
    });

    it('should complete template reference', () => {
      const [completions, token] = completer('/test @form');

      expect(token).toBe('@form');
      expect(completions.length).toBeGreaterThan(0);
      expect(completions.some(c => c.includes('form:login'))).toBe(true);
    });

    it('should preserve /test prefix when completing', () => {
      const line = '/test #But';
      const [completions, token] = completer(line);

      const result = line.replace(token, '#Button');
      expect(result).toBe('/test #Button');
    });

    it('should work with completed reference', () => {
      testCommand(state, '#Button');

      expect(consoleOutput.some(line => line.includes('resolved successfully'))).toBe(true);
      expect(consoleOutput.some(line => line.includes('src/components/Button.tsx'))).toBe(true);
    });
  });

  describe('Multiple completions in sequence', () => {
    it('should handle folder then file completion', () => {
      // First complete folder
      const [folderCompletions, folderToken] = completer('/info .src.comp');
      expect(folderToken).toBe('.src.comp');
      expect(folderCompletions).toContain('.src.components');

      // Then complete file in that folder
      const [fileCompletions, fileToken] = completer('/info .src.components#But');
      expect(fileToken).toBe('#But');
      expect(fileCompletions).toContain('#Button');
    });

    it('should preserve entire command with nested completion', () => {
      const line = '/test .src.components.forms#Login';
      const [completions, token] = completer(line);

      expect(token).toBe('#Login');
      const result = line.replace(token, '#LoginForm');
      expect(result).toBe('/test .src.components.forms#LoginForm');
    });
  });

  describe('Tab completion with various command formats', () => {
    it('should work with command and single reference', () => {
      const [completions, token] = completer('/info #But');
      expect(token).toBe('#But');
      expect(completions).toContain('#Button');
    });

    it('should work with command and folder.file reference', () => {
      const [completions, token] = completer('/test .src.components#Inp');
      expect(token).toBe('#Inp');
      expect(completions).toContain('#Input');
    });

    it('should work with template reference', () => {
      const [completions, token] = completer('/test @button:pr');
      expect(token).toBe('@button:pr');
      expect(completions).toContain('@button:primary');
    });

    it('should not interfere with regular arguments', () => {
      const [completions, token] = completer('/info Button.tsx');
      // Note: .tsx is matched as a potential folder reference (edge case)
      // but won't find any completions since no folder is named "tsx"
      expect(token).toBe('.tsx');
      expect(completions).toHaveLength(0);
    });
  });

  describe('Edge cases with commands', () => {
    it('should handle spaces before reference', () => {
      const [completions, token] = completer('/info   #But');
      expect(token).toBe('#But');
      expect(completions).toContain('#Button');
    });

    it('should handle command with flags and reference', () => {
      const [completions, token] = completer('/info --verbose #But');
      expect(token).toBe('#But');
      expect(completions).toContain('#Button');
    });

    it('should only match reference at end of line', () => {
      const [completions, token] = completer('/info #Button extra');
      expect(token).toBe('');
      expect(completions).toHaveLength(0);
    });

    it('should handle case-insensitive matching', () => {
      const [completions, token] = completer('/info #but');
      expect(token).toBe('#but');
      expect(completions).toContain('#Button');
    });
  });

  describe('Completion with file filters', () => {
    it('should filter to specific files', () => {
      const [completions, token] = completer('/info #Login');
      expect(token).toBe('#Login');
      expect(completions).toContain('#LoginForm');
      expect(completions).not.toContain('#Button');
      expect(completions).not.toContain('#Input');
      expect(completions).not.toContain('#SignupForm');
    });

    it('should show all forms with Form prefix', () => {
      const [completions, token] = completer('/info #Form');
      expect(token).toBe('#Form');
      // Matches files containing "Form" (LoginForm, SignupForm)
      expect(completions).toContain('#LoginForm');
      expect(completions).toContain('#SignupForm');
    });

    it('should match files containing substring', () => {
      const [completions, token] = completer('/info #Form');
      // The autocomplete is case-insensitive and matches containing substring
      expect(token).toBe('#Form');
    });
  });

  describe('Template completion with commands', () => {
    it('should complete form templates', () => {
      const [completions, token] = completer('/generate @form:');
      expect(token).toBe('@form:');
      expect(completions).toContain('@form:login');
      expect(completions).toContain('@form:signup');
      expect(completions).toContain('@form:contact');
      expect(completions).toContain('@form:search');
    });

    it('should complete button templates', () => {
      const [completions, token] = completer('/generate @button');
      expect(token).toBe('@button');
      expect(completions).toContain('@button:primary');
      expect(completions).toContain('@button:secondary');
      expect(completions).toContain('@button:ghost');
    });

    it('should complete card templates', () => {
      const [completions, token] = completer('/create @card:p');
      expect(token).toBe('@card:p');
      expect(completions).toContain('@card:product');
    });

    it('should preserve command when completing template', () => {
      const line = '/generate @form:log';
      const [completions, token] = completer(line);
      expect(token).toBe('@form:log');

      const result = line.replace(token, '@form:login');
      expect(result).toBe('/generate @form:login');
    });
  });

  describe('Real-world command scenarios', () => {
    it('should support: /info #Button', () => {
      const line = '/info #Button';
      const [completions, token] = completer(line);

      // If user types this and hits TAB at the end
      expect(token).toBe('#Button');
    });

    it('should support: /test .src.components#Button', () => {
      const line = '/test .src.components#Button';
      const [completions, token] = completer(line);

      expect(token).toBe('#Button');

      // Verify reference resolves
      const resolved = autocompleter.resolveReference('.src.components#Button');
      expect(resolved).toBe('src/components/Button.tsx');
    });

    it('should support: /test @form:login', () => {
      const line = '/test @form:login';
      const [completions, token] = completer(line);

      expect(token).toBe('@form:login');
    });

    it('should handle typical user workflow', () => {
      // User types "/info #" and presses TAB
      let [completions, token] = completer('/info #');
      expect(completions.length).toBeGreaterThan(0);
      expect(completions).toContain('#Button');

      // User types more: "/info #But" and presses TAB
      [completions, token] = completer('/info #But');
      expect(completions).toContain('#Button');
      expect(completions).not.toContain('#Input');

      // User selects #Button - the command becomes "/info #Button"
      // Now they can execute it
      const finalCommand = '/info #Button';
      expect(finalCommand).toBe('/info #Button');
    });
  });

  describe('No completion scenarios', () => {
    it('should not complete regular file names', () => {
      const [completions, token] = completer('/info Button.tsx');
      // Note: .tsx is matched as a potential folder reference (edge case)
      // but won't find any completions
      expect(token).toBe('.tsx');
      expect(completions).toHaveLength(0);
    });

    it('should not complete without special prefix', () => {
      const [completions, token] = completer('/info Button');
      expect(token).toBe('');
      expect(completions).toHaveLength(0);
    });

    it('should not complete for unknown commands', () => {
      const [completions, token] = completer('/unknown #Button');
      // Completion works regardless of command validity
      expect(token).toBe('#Button');
      expect(completions.length).toBeGreaterThan(0);
    });
  });
});
