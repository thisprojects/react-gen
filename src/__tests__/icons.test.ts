import { describe, it, expect, beforeEach } from '@jest/globals';
import { icons, forceAsciiMode, forceUnicodeMode } from '../utils/icons.js';

describe('icons utility', () => {
  describe('icon fallbacks', () => {
    it('should provide folder icon', () => {
      expect(icons.folder).toBeDefined();
      expect(typeof icons.folder).toBe('string');
    });

    it('should provide file icon', () => {
      expect(icons.file).toBeDefined();
      expect(typeof icons.file).toBe('string');
    });

    it('should provide test icon', () => {
      expect(icons.test).toBeDefined();
      expect(typeof icons.test).toBe('string');
    });

    it('should provide checkmark icon', () => {
      expect(icons.checkmark).toBeDefined();
      expect(typeof icons.checkmark).toBe('string');
    });
  });

  describe('ASCII mode', () => {
    beforeEach(() => {
      forceUnicodeMode(); // Reset to default
    });

    it('should switch to ASCII icons when forced', () => {
      forceAsciiMode();

      expect(icons.folder).toBe('[DIR]');
      expect(icons.file).toBe('[FILE]');
      expect(icons.test).toBe('[TEST]');
      expect(icons.checkmark).toBe('[OK]');
      expect(icons.cross).toBe('[X]');
      expect(icons.arrow).toBe('->');
    });
  });

  describe('Unicode mode', () => {
    beforeEach(() => {
      forceAsciiMode(); // Start with ASCII
    });

    it('should switch to Unicode icons when forced', () => {
      forceUnicodeMode();

      expect(icons.folder).toBe('📁');
      expect(icons.file).toBe('📄');
      expect(icons.test).toBe('🧪');
      expect(icons.checkmark).toBe('✓');
      expect(icons.cross).toBe('✗');
      expect(icons.arrow).toBe('→');
    });
  });

  describe('icon consistency', () => {
    it('should have all required icons defined', () => {
      const requiredIcons = [
        'folder',
        'file',
        'test',
        'checkmark',
        'cross',
        'arrow',
        'info',
        'warning'
      ];

      for (const iconName of requiredIcons) {
        expect(icons).toHaveProperty(iconName);
        expect(typeof (icons as any)[iconName]).toBe('string');
        expect((icons as any)[iconName].length).toBeGreaterThan(0);
      }
    });
  });
});
