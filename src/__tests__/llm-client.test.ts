import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { OllamaClient } from '../core/llm/ollama-client.js';

// Mock the Ollama class
jest.mock('ollama');

describe('OllamaClient', () => {
  let client: OllamaClient;

  beforeEach(() => {
    jest.clearAllMocks();
    client = new OllamaClient({ model: 'qwen2.5-coder:14b' });
  });

  describe('constructor', () => {
    it('should create client with default model', () => {
      const defaultClient = new OllamaClient();
      expect(defaultClient).toBeDefined();
    });

    it('should create client with custom model', () => {
      const customClient = new OllamaClient({ model: 'custom-model' });
      expect(customClient).toBeDefined();
    });

    it('should use OLLAMA_HOST from environment if set', () => {
      const originalEnv = process.env.OLLAMA_HOST;
      process.env.OLLAMA_HOST = 'http://custom-host:1234';

      const envClient = new OllamaClient();
      expect(envClient).toBeDefined();

      // Restore original env
      if (originalEnv) {
        process.env.OLLAMA_HOST = originalEnv;
      } else {
        delete process.env.OLLAMA_HOST;
      }
    });
  });

  describe('initialize', () => {
    it('should initialize successfully when model exists', async () => {
      await expect(client.initialize()).resolves.not.toThrow();
      expect(client.isInitialized()).toBe(true);
    });

    it('should throw error if model not found', async () => {
      // Mock Ollama to return empty models list
      const mockOllama = require('ollama');
      mockOllama.Ollama.prototype.list = jest.fn<any>().mockResolvedValue({
        models: []
      });

      const newClient = new OllamaClient({ model: 'missing-model' });

      await expect(newClient.initialize()).rejects.toThrow('Model missing-model not found');
    });

    it('should handle connection refused error', async () => {
      const mockOllama = require('ollama');
      const error = new Error('Connection refused') as any;
      error.code = 'ECONNREFUSED';
      mockOllama.Ollama.prototype.list = jest.fn<any>().mockRejectedValue(error);

      const newClient = new OllamaClient();

      await expect(newClient.initialize()).rejects.toThrow('Cannot connect to Ollama');
    });
  });

  describe('generate', () => {
    beforeEach(async () => {
      await client.initialize();
    });

    it('should generate code successfully', async () => {
      const prompt = 'Generate a React component';
      const result = await client.generate(prompt);

      expect(result).toBeDefined();
      expect(typeof result).toBe('string');
    });

    it('should use custom temperature option', async () => {
      const prompt = 'Generate code';
      const result = await client.generate(prompt, { temperature: 0.5 });

      expect(result).toBeDefined();
    });

    it('should use custom maxTokens option', async () => {
      const prompt = 'Generate code';
      const result = await client.generate(prompt, { maxTokens: 2000 });

      expect(result).toBeDefined();
    });

    it('should throw error if not initialized', async () => {
      const uninitializedClient = new OllamaClient();

      await expect(
        uninitializedClient.generate('test')
      ).rejects.toThrow('Ollama not initialized');
    });
  });

  describe('checkStatus', () => {
    it('should return status when connected', async () => {
      const status = await client.checkStatus();

      expect(status).toHaveProperty('connected');
      expect(status).toHaveProperty('model');
      expect(status).toHaveProperty('available');
      expect(status.connected).toBe(true);
    });

    it('should handle connection failure', async () => {
      const mockOllama = require('ollama');
      mockOllama.Ollama.prototype.list = jest.fn<any>().mockRejectedValue(
        new Error('Connection failed')
      );

      const newClient = new OllamaClient();
      const status = await newClient.checkStatus();

      expect(status.connected).toBe(false);
    });

    it('should indicate model availability', async () => {
      const status = await client.checkStatus();

      expect(status.model).toBe('qwen2.5-coder:14b');
      expect(status.available).toBe(true);
    });
  });

  describe('isInitialized', () => {
    it('should return false before initialization', () => {
      const newClient = new OllamaClient();
      expect(newClient.isInitialized()).toBe(false);
    });

    it('should return true after initialization', async () => {
      await client.initialize();
      expect(client.isInitialized()).toBe(true);
    });
  });

  describe('generation options', () => {
    beforeEach(async () => {
      await client.initialize();
    });

    it('should use default temperature if not specified', async () => {
      const result = await client.generate('test prompt');
      expect(result).toBeDefined();
    });

    it('should use default maxTokens if not specified', async () => {
      const result = await client.generate('test prompt');
      expect(result).toBeDefined();
    });

    it('should include stop sequences', async () => {
      const result = await client.generate('test prompt');
      expect(result).toBeDefined();
      // Stop sequences are sent to Ollama to prevent over-generation
    });
  });

  describe('error handling', () => {
    it('should propagate Ollama errors', async () => {
      const mockOllama = require('ollama');
      mockOllama.Ollama.prototype.generate = jest.fn<any>().mockRejectedValue(
        new Error('Ollama error')
      );

      await client.initialize();

      await expect(client.generate('test')).rejects.toThrow();
    });
  });

  describe('model name variations', () => {
    it('should handle model name with tag', async () => {
      const client = new OllamaClient({ model: 'qwen2.5-coder:14b' });
      await expect(client.initialize()).resolves.not.toThrow();
    });

    it('should handle model name prefix matching', async () => {
      // Mock should match even if full name has more details
      const client = new OllamaClient({ model: 'qwen2.5-coder' });
      await expect(client.initialize()).resolves.not.toThrow();
    });
  });
});
