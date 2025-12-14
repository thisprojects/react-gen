import { describe, it, expect } from '@jest/globals';
import { RequestParser } from '../core/llm/request-parser.js';

describe('RequestParser', () => {
  let parser: RequestParser;

  beforeEach(() => {
    parser = new RequestParser();
  });

  describe('parse', () => {
    it('should parse single @reference', () => {
      const result = parser.parse('create a @login form');

      expect(result.components).toHaveLength(1);
      expect(result.components[0].symbol).toBe('@login');
      expect(result.components[0].template).toBe('form:login');
      expect(result.components[0].count).toBe(1);
    });

    it('should parse multiple @references', () => {
      const result = parser.parse('make a @login page with a @button');

      expect(result.components).toHaveLength(2);
      expect(result.components[0].symbol).toBe('@login');
      expect(result.components[0].template).toBe('form:login');
      expect(result.components[1].symbol).toBe('@button');
      expect(result.components[1].template).toBe('button:primary');
    });

    it('should handle direct template references', () => {
      const result = parser.parse('@form:login');

      expect(result.components).toHaveLength(1);
      expect(result.components[0].symbol).toBe('@form:login');
      expect(result.components[0].template).toBe('form:login');
    });

    it('should extract count from text (number words)', () => {
      const result = parser.parse('create three @card components');

      expect(result.components).toHaveLength(1);
      expect(result.components[0].count).toBe(3);
    });

    it('should extract count from text (digits)', () => {
      const result = parser.parse('create 5 @card components');

      expect(result.components).toHaveLength(1);
      expect(result.components[0].count).toBe(5);
    });

    it('should default count to 1 when not specified', () => {
      const result = parser.parse('create a @card component');

      expect(result.components).toHaveLength(1);
      expect(result.components[0].count).toBe(1);
    });

    it('should extract context around reference', () => {
      const result = parser.parse('create a beautiful @login form with validation');

      expect(result.components).toHaveLength(1);
      expect(result.components[0].context).toContain('@login');
    });

    it('should handle duplicate references', () => {
      const result = parser.parse('create a @login form and another @login form');

      expect(result.components).toHaveLength(1);
      expect(result.components[0].symbol).toBe('@login');
    });

    it('should map common shorthand references', () => {
      const testCases = [
        { input: '@signup', expected: 'form:signup' },
        { input: '@register', expected: 'form:signup' },
        { input: '@contact', expected: 'form:contact' },
        { input: '@btn', expected: 'button:primary' },
        { input: '@modal', expected: 'modal:confirm' },
        { input: '@dialog', expected: 'modal:confirm' },
      ];

      testCases.forEach(({ input, expected }) => {
        const result = parser.parse(input);
        expect(result.components[0].template).toBe(expected);
      });
    });

    it('should ignore invalid references', () => {
      const result = parser.parse('create a @invalid component');

      expect(result.components).toHaveLength(0);
    });

    it('should preserve raw input', () => {
      const input = 'make me a @login page';
      const result = parser.parse(input);

      expect(result.rawInput).toBe(input);
      expect(result.description).toBe(input);
    });
  });

  describe('isValid', () => {
    it('should return true for valid parsed request', () => {
      const result = parser.parse('create a @login form');
      expect(parser.isValid(result)).toBe(true);
    });

    it('should return false for invalid parsed request', () => {
      const result = parser.parse('create a form');
      expect(parser.isValid(result)).toBe(false);
    });
  });

  describe('getHelpText', () => {
    it('should return help text for empty components', () => {
      const result = parser.parse('create a form');
      const helpText = parser.getHelpText(result);

      expect(helpText).toContain('No valid @components found');
      expect(helpText).toContain('Available');
    });

    it('should return empty string for valid request', () => {
      const result = parser.parse('create a @login form');
      const helpText = parser.getHelpText(result);

      expect(helpText).toBe('');
    });
  });

  describe('count extraction', () => {
    it('should handle all number words', () => {
      const testCases = [
        { word: 'one', expected: 1 },
        { word: 'two', expected: 2 },
        { word: 'three', expected: 3 },
        { word: 'four', expected: 4 },
        { word: 'five', expected: 5 },
        { word: 'six', expected: 6 },
        { word: 'seven', expected: 7 },
        { word: 'eight', expected: 8 },
        { word: 'nine', expected: 9 },
        { word: 'ten', expected: 10 },
      ];

      testCases.forEach(({ word, expected }) => {
        const result = parser.parse(`create ${word} @card components`);
        expect(result.components[0].count).toBe(expected);
      });
    });

    it('should handle digits', () => {
      const result = parser.parse('create 15 @card components');
      expect(result.components[0].count).toBe(15);
    });

    it('should prioritize number words over digits', () => {
      const result = parser.parse('create 10 three @card components');
      expect(result.components[0].count).toBe(3);
    });
  });

  describe('complex scenarios', () => {
    it('should handle multiple components with counts', () => {
      const result = parser.parse('build a page with three @card and two @button components');

      expect(result.components).toHaveLength(2);
      expect(result.components[0].count).toBe(3);
      expect(result.components[1].count).toBe(2);
    });

    it('should handle mixed shorthand and full references', () => {
      const result = parser.parse('create @login and @form:signup');

      expect(result.components).toHaveLength(2);
      expect(result.components[0].template).toBe('form:login');
      expect(result.components[1].template).toBe('form:signup');
    });

    it('should handle case-insensitive references', () => {
      const result = parser.parse('create @LOGIN and @Button');

      expect(result.components).toHaveLength(2);
      expect(result.components[0].template).toBe('form:login');
      expect(result.components[1].template).toBe('button:primary');
    });
  });
});
