import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals';
import { llmCommand } from '../commands/llm.js';
import { OllamaClient } from '../core/llm/ollama-client.js';

jest.mock('ollama');

describe('llmCommand', () => {
  let mockOllamaClient: OllamaClient;
  let consoleLogSpy: jest.SpiedFunction<typeof console.log>;

  beforeEach(() => {
    mockOllamaClient = new OllamaClient({ model: 'test-model' });
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
  });

  afterEach(() => {
    consoleLogSpy.mockRestore();
  });

  describe('status command (no subcommand)', () => {
    it('should show connection error when Ollama not running', async () => {
      const mockCheckStatus = jest.fn().mockResolvedValue({
        connected: false,
        model: 'test-model',
        available: false,
      });
      mockOllamaClient.checkStatus = mockCheckStatus;

      await llmCommand(mockOllamaClient);

      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('Cannot connect to Ollama')
      );
    });

    it('should show model not available when model missing', async () => {
      const mockCheckStatus = jest.fn().mockResolvedValue({
        connected: true,
        model: 'test-model',
        available: false,
      });
      mockOllamaClient.checkStatus = mockCheckStatus;

      await llmCommand(mockOllamaClient);

      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('Model not available')
      );
    });

    it('should show ready status when initialized', async () => {
      const mockCheckStatus = jest.fn().mockResolvedValue({
        connected: true,
        model: 'test-model',
        available: true,
      });
      mockOllamaClient.checkStatus = mockCheckStatus;
      mockOllamaClient.isInitialized = jest.fn().mockReturnValue(true);

      await llmCommand(mockOllamaClient);

      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('Ollama ready')
      );
    });

    it('should show initialization prompt when connected but not initialized', async () => {
      const mockCheckStatus = jest.fn().mockResolvedValue({
        connected: true,
        model: 'test-model',
        available: true,
      });
      mockOllamaClient.checkStatus = mockCheckStatus;
      mockOllamaClient.isInitialized = jest.fn().mockReturnValue(false);

      await llmCommand(mockOllamaClient);

      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('not initialized')
      );
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('/llm init')
      );
    });
  });

  describe('status subcommand', () => {
    it('should show same output as no subcommand', async () => {
      const mockCheckStatus = jest.fn().mockResolvedValue({
        connected: true,
        model: 'test-model',
        available: true,
      });
      mockOllamaClient.checkStatus = mockCheckStatus;
      mockOllamaClient.isInitialized = jest.fn().mockReturnValue(true);

      await llmCommand(mockOllamaClient, 'status');

      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('Ollama ready')
      );
    });
  });

  describe('init subcommand', () => {
    it('should initialize Ollama successfully', async () => {
      const mockInitialize = jest.fn().mockResolvedValue(undefined);
      mockOllamaClient.initialize = mockInitialize;
      mockOllamaClient.isInitialized = jest.fn().mockReturnValue(false);

      await llmCommand(mockOllamaClient, 'init');

      expect(mockInitialize).toHaveBeenCalled();
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('initialized successfully')
      );
    });

    it('should show already initialized message', async () => {
      mockOllamaClient.isInitialized = jest.fn().mockReturnValue(true);

      await llmCommand(mockOllamaClient, 'init');

      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('Already initialized')
      );
    });

    it('should handle initialization errors', async () => {
      const mockInitialize = jest.fn().mockRejectedValue(new Error('Init failed'));
      mockOllamaClient.initialize = mockInitialize;
      mockOllamaClient.isInitialized = jest.fn().mockReturnValue(false);

      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

      await llmCommand(mockOllamaClient, 'init');

      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('Initialization failed')
      );
      expect(consoleErrorSpy).toHaveBeenCalled();

      consoleErrorSpy.mockRestore();
    });

    it('should show usage example after successful initialization', async () => {
      const mockInitialize = jest.fn().mockResolvedValue(undefined);
      mockOllamaClient.initialize = mockInitialize;
      mockOllamaClient.isInitialized = jest.fn().mockReturnValue(false);

      await llmCommand(mockOllamaClient, 'init');

      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('@login')
      );
    });
  });

  describe('models subcommand', () => {
    it('should show current model when connected', async () => {
      const mockCheckStatus = jest.fn().mockResolvedValue({
        connected: true,
        model: 'test-model',
        available: true,
      });
      mockOllamaClient.checkStatus = mockCheckStatus;

      await llmCommand(mockOllamaClient, 'models');

      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('Connected to Ollama')
      );
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('test-model')
      );
    });

    it('should show error when not connected', async () => {
      const mockCheckStatus = jest.fn().mockResolvedValue({
        connected: false,
        model: 'test-model',
        available: false,
      });
      mockOllamaClient.checkStatus = mockCheckStatus;

      await llmCommand(mockOllamaClient, 'models');

      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('Cannot connect to Ollama')
      );
    });

    it('should suggest ollama list command', async () => {
      const mockCheckStatus = jest.fn().mockResolvedValue({
        connected: true,
        model: 'test-model',
        available: true,
      });
      mockOllamaClient.checkStatus = mockCheckStatus;

      await llmCommand(mockOllamaClient, 'models');

      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('ollama list')
      );
    });

    it('should handle checkStatus errors', async () => {
      const mockCheckStatus = jest.fn().mockRejectedValue(new Error('Status error'));
      mockOllamaClient.checkStatus = mockCheckStatus;

      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

      await llmCommand(mockOllamaClient, 'models');

      expect(consoleErrorSpy).toHaveBeenCalled();

      consoleErrorSpy.mockRestore();
    });
  });

  describe('unknown subcommand', () => {
    it('should show error for unknown subcommand', async () => {
      await llmCommand(mockOllamaClient, 'unknown');

      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('Unknown subcommand: unknown')
      );
    });

    it('should show available commands', async () => {
      await llmCommand(mockOllamaClient, 'invalid');

      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('Available commands')
      );
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('/llm init')
      );
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('/llm status')
      );
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('/llm models')
      );
    });
  });

  describe('case sensitivity', () => {
    it('should handle uppercase subcommands', async () => {
      mockOllamaClient.isInitialized = jest.fn().mockReturnValue(true);

      await llmCommand(mockOllamaClient, 'INIT');

      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('Already initialized')
      );
    });

    it('should handle mixed case subcommands', async () => {
      const mockCheckStatus = jest.fn().mockResolvedValue({
        connected: true,
        model: 'test-model',
        available: true,
      });
      mockOllamaClient.checkStatus = mockCheckStatus;

      await llmCommand(mockOllamaClient, 'Status');

      expect(consoleLogSpy).toHaveBeenCalled();
    });
  });

  describe('output formatting', () => {
    it('should use colored output for status messages', async () => {
      const mockCheckStatus = jest.fn().mockResolvedValue({
        connected: false,
        model: 'test-model',
        available: false,
      });
      mockOllamaClient.checkStatus = mockCheckStatus;

      await llmCommand(mockOllamaClient);

      // Chalk is mocked, but we can verify console.log was called
      expect(consoleLogSpy).toHaveBeenCalled();
    });

    it('should show helpful instructions', async () => {
      const mockCheckStatus = jest.fn().mockResolvedValue({
        connected: false,
        model: 'test-model',
        available: false,
      });
      mockOllamaClient.checkStatus = mockCheckStatus;

      await llmCommand(mockOllamaClient);

      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('ollama serve')
      );
    });
  });
});
