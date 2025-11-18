import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import {
  displayWelcome,
  displayError,
  displaySuccess,
  displayInfo,
  displayWarning
} from '../utils/display.js';

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

describe('display utilities', () => {
  describe('displayWelcome', () => {
    it('should display welcome message', () => {
      displayWelcome();

      expect(consoleOutput.length).toBeGreaterThan(0);
      const output = consoleOutput.join(' ');
      expect(output).toContain('ReactGen');
      expect(output).toContain('v1.0');
    });

    it('should include REPL mode message', () => {
      displayWelcome();

      const output = consoleOutput.join(' ');
      expect(output).toContain('REPL');
    });

    it('should mention help command', () => {
      displayWelcome();

      const output = consoleOutput.join(' ');
      expect(output).toContain('/help');
    });

    it('should include React Component Assistant', () => {
      displayWelcome();

      const output = consoleOutput.join(' ');
      expect(output).toContain('React Component Assistant');
    });
  });

  describe('displayError', () => {
    it('should display error message with symbol', () => {
      displayError('Something went wrong');

      expect(consoleOutput.length).toBe(1);
      const output = consoleOutput[0];
      expect(output).toContain('Something went wrong');
      expect(output).toContain('✗');
    });

    it('should handle empty message', () => {
      displayError('');

      expect(consoleOutput.length).toBe(1);
      expect(consoleOutput[0]).toContain('✗');
    });

    it('should handle long messages', () => {
      const longMessage = 'This is a very long error message that contains lots of information about what went wrong';
      displayError(longMessage);

      expect(consoleOutput[0]).toContain(longMessage);
    });
  });

  describe('displaySuccess', () => {
    it('should display success message with symbol', () => {
      displaySuccess('Operation completed');

      expect(consoleOutput.length).toBe(1);
      const output = consoleOutput[0];
      expect(output).toContain('Operation completed');
      expect(output).toContain('✓');
    });

    it('should handle empty message', () => {
      displaySuccess('');

      expect(consoleOutput.length).toBe(1);
      expect(consoleOutput[0]).toContain('✓');
    });

    it('should display multiple success messages', () => {
      displaySuccess('First success');
      displaySuccess('Second success');

      expect(consoleOutput.length).toBe(2);
      expect(consoleOutput[0]).toContain('First success');
      expect(consoleOutput[1]).toContain('Second success');
    });
  });

  describe('displayInfo', () => {
    it('should display info message with symbol', () => {
      displayInfo('Here is some information');

      expect(consoleOutput.length).toBe(1);
      const output = consoleOutput[0];
      expect(output).toContain('Here is some information');
      expect(output).toContain('ℹ');
    });

    it('should handle empty message', () => {
      displayInfo('');

      expect(consoleOutput.length).toBe(1);
      expect(consoleOutput[0]).toContain('ℹ');
    });

    it('should handle messages with special characters', () => {
      displayInfo('Info: 100% complete');

      expect(consoleOutput[0]).toContain('Info: 100% complete');
    });
  });

  describe('displayWarning', () => {
    it('should display warning message with symbol', () => {
      displayWarning('This is a warning');

      expect(consoleOutput.length).toBe(1);
      const output = consoleOutput[0];
      expect(output).toContain('This is a warning');
      expect(output).toContain('⚠');
    });

    it('should handle empty message', () => {
      displayWarning('');

      expect(consoleOutput.length).toBe(1);
      expect(consoleOutput[0]).toContain('⚠');
    });

    it('should handle multiple warnings', () => {
      displayWarning('Warning 1');
      displayWarning('Warning 2');
      displayWarning('Warning 3');

      expect(consoleOutput.length).toBe(3);
      expect(consoleOutput[0]).toContain('Warning 1');
      expect(consoleOutput[1]).toContain('Warning 2');
      expect(consoleOutput[2]).toContain('Warning 3');
    });
  });

  describe('all display functions', () => {
    it('should work together without conflicts', () => {
      displaySuccess('Success message');
      displayError('Error message');
      displayInfo('Info message');
      displayWarning('Warning message');

      expect(consoleOutput.length).toBe(4);
      expect(consoleOutput[0]).toContain('Success message');
      expect(consoleOutput[1]).toContain('Error message');
      expect(consoleOutput[2]).toContain('Info message');
      expect(consoleOutput[3]).toContain('Warning message');
    });

    it('should maintain order of calls', () => {
      displayInfo('First');
      displayWarning('Second');
      displayError('Third');
      displaySuccess('Fourth');

      expect(consoleOutput[0]).toContain('First');
      expect(consoleOutput[1]).toContain('Second');
      expect(consoleOutput[2]).toContain('Third');
      expect(consoleOutput[3]).toContain('Fourth');
    });
  });

  describe('message formatting', () => {
    it('should handle messages with newlines', () => {
      displayInfo('Line 1\nLine 2');

      expect(consoleOutput[0]).toContain('Line 1\nLine 2');
    });

    it('should handle messages with numbers', () => {
      displaySuccess('Found 42 files');

      expect(consoleOutput[0]).toContain('Found 42 files');
    });

    it('should handle messages with paths', () => {
      displayInfo('File: /path/to/component.tsx');

      expect(consoleOutput[0]).toContain('/path/to/component.tsx');
    });

    it('should handle messages with Unicode characters', () => {
      displaySuccess('项目初始化成功');

      expect(consoleOutput[0]).toContain('项目初始化成功');
    });
  });
});
