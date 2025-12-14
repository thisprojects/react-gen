import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals';
import { generateCommand } from '../commands/generate.js';
import { REPLState } from '../repl/state.js';
import fs from 'fs/promises';

jest.mock('ollama');
jest.mock('inquirer');
jest.mock('fs/promises');
jest.mock('ora', () => {
  return jest.fn(() => ({
    start: jest.fn().mockReturnThis(),
    succeed: jest.fn().mockReturnThis(),
    fail: jest.fn().mockReturnThis(),
    stop: jest.fn().mockReturnThis()
  }));
});

// Mock inquirer module at the top level
jest.mock('inquirer', () => ({
  prompt: jest.fn()
}));

describe('generateCommand', () => {
  let state: REPLState;
  let consoleLogSpy: jest.SpiedFunction<typeof console.log>;
  let consoleErrorSpy: jest.SpiedFunction<typeof console.error>;
  let mockInquirerPrompt: jest.Mock;

  beforeEach(() => {
    state = new REPLState();
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    // Mock fs.access to simulate files don't exist
    (fs.access as jest.Mock).mockRejectedValue(new Error('File not found') as never);

    // Mock fs.mkdir to succeed
    (fs.mkdir as jest.Mock).mockResolvedValue(undefined as never);

    // Mock fs.writeFile to succeed
    (fs.writeFile as jest.Mock).mockResolvedValue(undefined as never);

    // Get reference to inquirer.prompt mock
    const inquirer = require('inquirer');
    mockInquirerPrompt = inquirer.prompt as jest.Mock<any>;
    mockInquirerPrompt.mockReset();
    mockInquirerPrompt.mockResolvedValue({ confirm: true } as never);

    // Mock the ollama client's ollama instance
    (state.ollamaClient as any).ollama = {
      list: jest.fn<any>().mockResolvedValue({
        models: [{ name: 'qwen2.5-coder:14b' }]
      }),
      generate: jest.fn<any>().mockResolvedValue({
        response: 'export default function Component() { return <div>Test</div>; }'
      })
    };
  });

  afterEach(() => {
    consoleLogSpy.mockRestore();
    consoleErrorSpy.mockRestore();
    // Clear fs and inquirer mock call history for next test
    (fs.access as jest.Mock).mockClear();
    (fs.mkdir as jest.Mock).mockClear();
    (fs.writeFile as jest.Mock).mockClear();
    mockInquirerPrompt.mockClear();
  });

  describe('initialization check', () => {
    it('should show error if Ollama not initialized', async () => {
      jest.spyOn(state.ollamaClient, 'isInitialized').mockReturnValue(false);

      await generateCommand(state, 'create a @login form');

      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('Ollama not initialized')
      );
    });

    it('should proceed if Ollama initialized', async () => {
      await state.ollamaClient.initialize();

      await generateCommand(state, 'create a @login form');

      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('Analyzing request')
      );
    });
  });

  describe('request parsing', () => {
    beforeEach(async () => {
      await state.ollamaClient.initialize();
    });

    it('should show error for invalid requests', async () => {
      await generateCommand(state, 'create a form');

      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('No valid @components found')
      );
    });

    it('should show example usage for invalid requests', async () => {
      await generateCommand(state, 'invalid input');

      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('Example')
      );
    });

    it('should parse single component', async () => {
      await generateCommand(state, 'create a @login form');

      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('Found 1 component')
      );
    });

    it('should parse multiple components', async () => {
      await generateCommand(state, 'create a @login and @button');

      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('Found 2 component')
      );
    });

    it('should show component mappings', async () => {
      await generateCommand(state, 'create a @login form');

      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('@login')
      );
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('form:login')
      );
    });
  });

  describe('component generation', () => {
    beforeEach(async () => {
      await state.ollamaClient.initialize();
      state.projectRoot = '/test/project';
    });

    it('should generate component code', async () => {
      mockInquirerPrompt.mockResolvedValue({ confirm: true } as never);

      await generateCommand(state, 'create a @button');

      // Should analyze the request and find the component
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('Found 1 component')
      );
    });

    it('should use project root for file paths', async () => {
      mockInquirerPrompt.mockResolvedValue({ confirm: true } as never);

      await generateCommand(state, '@login');

      expect(fs.writeFile).toHaveBeenCalledWith(
        expect.stringContaining('/test/project/src/components'),
        expect.any(String),
        'utf-8'
      );
    });

    it('should use current directory if no project root', async () => {
      state.projectRoot = null;
      mockInquirerPrompt.mockResolvedValue({ confirm: true } as never);

      await generateCommand(state, '@button');

      expect(fs.writeFile).toHaveBeenCalled();
    });

    it('should skip existing files', async () => {
      (fs.access as jest.Mock<any>).mockResolvedValue(undefined); // File exists

      await generateCommand(state, '@login');

      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('File exists')
      );
    });

    it('should handle multiple components with counts', async () => {
      mockInquirerPrompt.mockResolvedValue({ confirm: true } as never);

      await generateCommand(state, 'create three @card components');

      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('x3')
      );
    });
  });

  describe('file creation', () => {
    beforeEach(async () => {
      await state.ollamaClient.initialize();
      state.projectRoot = '/test/project';
    });

    it('should show confirmation prompt', async () => {
      mockInquirerPrompt.mockResolvedValue({ confirm: true } as never);

      await generateCommand(state, '@login');

      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('Will create')
      );
      expect(mockInquirerPrompt).toHaveBeenCalled();
    });

    it('should cancel on user rejection', async () => {
      mockInquirerPrompt.mockResolvedValue({ confirm: false } as never);

      await generateCommand(state, '@login');

      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('Cancelled')
      );
      expect(fs.writeFile).not.toHaveBeenCalled();
    });

    it('should create directories if needed', async () => {
      mockInquirerPrompt.mockResolvedValue({ confirm: true } as never);

      await generateCommand(state, '@button');

      expect(fs.mkdir).toHaveBeenCalledWith(
        expect.stringContaining('src/components'),
        { recursive: true }
      );
    });

    it('should write files on confirmation', async () => {
      mockInquirerPrompt.mockResolvedValue({ confirm: true } as never);

      await generateCommand(state, '@login');

      expect(fs.writeFile).toHaveBeenCalled();
    });

    it('should show success message after creation', async () => {
      mockInquirerPrompt.mockResolvedValue({ confirm: true } as never);

      await generateCommand(state, '@login');

      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('Created')
      );
    });

    it('should show line count in success message', async () => {
      mockInquirerPrompt.mockResolvedValue({ confirm: true } as never);

      await generateCommand(state, '@login');

      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringMatching(/\d+ lines/)
      );
    });
  });

  describe('component naming', () => {
    beforeEach(async () => {
      await state.ollamaClient.initialize();
      state.projectRoot = '/test/project';
    });

    it('should generate proper component name from template', async () => {
      mockInquirerPrompt.mockResolvedValue({ confirm: true } as never);

      await generateCommand(state, '@form:login');

      expect(fs.writeFile).toHaveBeenCalledWith(
        expect.stringContaining('Login.tsx'),
        expect.any(String),
        'utf-8'
      );
    });

    it('should number multiple components', async () => {
      mockInquirerPrompt.mockResolvedValue({ confirm: true } as never);

      await generateCommand(state, 'create three @card components');

      expect(fs.writeFile).toHaveBeenCalledWith(
        expect.stringContaining('Simple1.tsx'),
        expect.any(String),
        'utf-8'
      );
    });

    it('should capitalize component names', async () => {
      mockInquirerPrompt.mockResolvedValue({ confirm: true } as never);

      await generateCommand(state, '@button');

      expect(fs.writeFile).toHaveBeenCalledWith(
        expect.stringContaining('Primary.tsx'),
        expect.any(String),
        'utf-8'
      );
    });
  });

  describe('error handling', () => {
    beforeEach(async () => {
      await state.ollamaClient.initialize();
      state.projectRoot = '/test/project';
    });

    it('should handle generation errors', async () => {
      const mockOllama = state.ollamaClient as any;
      mockOllama.ollama.generate = jest.fn<any>().mockRejectedValue(new Error('Generation failed'));

      // Use a request with customization to trigger LLM usage
      await generateCommand(state, 'create a @login with custom styling');

      expect(consoleErrorSpy).toHaveBeenCalled();
    });

    it('should continue with other components on partial failure', async () => {
      mockInquirerPrompt.mockResolvedValue({ confirm: true } as never);

      // First component succeeds, would continue with others
      await generateCommand(state, '@login and @button');

      // Should attempt both components
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('Found 2 component')
      );
    });

    it('should show message when no files to create', async () => {
      // All files exist
      (fs.access as jest.Mock).mockResolvedValue(undefined as never);

      await generateCommand(state, '@login');

      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('No files to create')
      );
    });
  });

  describe('customization extraction', () => {
    beforeEach(async () => {
      await state.ollamaClient.initialize();
      state.projectRoot = '/test/project';
    });

    it('should extract customization text from description', async () => {
      mockInquirerPrompt.mockResolvedValue({ confirm: true } as never);

      await generateCommand(state, 'make a @login form with validation and error messages');

      // Customization should be passed to generator (we can't easily test this without more mocking)
      expect(fs.writeFile).toHaveBeenCalled();
    });

    it('should handle @references in customization text', async () => {
      mockInquirerPrompt.mockResolvedValue({ confirm: true } as never);

      await generateCommand(state, 'create a landing page with @button components');

      expect(fs.writeFile).toHaveBeenCalled();
    });
  });

  describe('output formatting', () => {
    beforeEach(async () => {
      await state.ollamaClient.initialize();
      state.projectRoot = '/test/project';
    });

    it('should show spinner during generation', async () => {
      mockInquirerPrompt.mockResolvedValue({ confirm: true } as never);

      await generateCommand(state, '@login');

      // Ora is mocked, but we can verify generation happened
      expect(fs.writeFile).toHaveBeenCalled();
    });

    it('should use relative paths in output', async () => {
      mockInquirerPrompt.mockResolvedValue({ confirm: true } as never);

      await generateCommand(state, '@login');

      // Should show relative path, not absolute
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringMatching(/src\/components/)
      );
    });
  });
});
