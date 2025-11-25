import { Ollama } from 'ollama';

export interface OllamaConfig {
  model: string;
  host?: string;
}

export class OllamaClient {
  private ollama: Ollama;
  private model: string;
  private isReady: boolean = false;

  constructor(config: OllamaConfig = { model: 'qwen2.5-coder:14b' }) {
    this.model = config.model;
    this.ollama = new Ollama({
      host: config.host || process.env.OLLAMA_HOST || 'http://localhost:11434'
    });
  }

  /**
   * Check if Ollama is running and model is available
   */
  async initialize(): Promise<void> {
    try {
      // Check if Ollama is running
      await this.ollama.list();

      // Check if model exists
      const models = await this.ollama.list();
      const modelExists = models.models.some(m =>
        m.name === this.model || m.name.startsWith(this.model)
      );

      if (!modelExists) {
        throw new Error(
          `Model ${this.model} not found in Ollama.\n` +
          `Run: ollama pull ${this.model}`
        );
      }

      this.isReady = true;
    } catch (error: any) {
      if (error.code === 'ECONNREFUSED') {
        throw new Error(
          'Cannot connect to Ollama. Is it running?\n' +
          'Start with: ollama serve'
        );
      }
      throw error;
    }
  }

  /**
   * Generate completion using Ollama
   */
  async generate(prompt: string, options: {
    temperature?: number;
    maxTokens?: number;
  } = {}): Promise<string> {
    if (!this.isReady) {
      throw new Error('Ollama not initialized. Run /llm init first.');
    }

    const response = await this.ollama.generate({
      model: this.model,
      prompt,
      options: {
        temperature: options.temperature || 0.7,
        num_predict: options.maxTokens || 1500,
        stop: ['</code>', '```\n\n']
      },
      stream: false
    });

    return response.response;
  }

  /**
   * Check connection status
   */
  async checkStatus(): Promise<{
    connected: boolean;
    model: string;
    available: boolean;
  }> {
    try {
      const models = await this.ollama.list();
      const modelAvailable = models.models.some(m =>
        m.name === this.model || m.name.startsWith(this.model)
      );

      return {
        connected: true,
        model: this.model,
        available: modelAvailable
      };
    } catch {
      return {
        connected: false,
        model: this.model,
        available: false
      };
    }
  }

  isInitialized(): boolean {
    return this.isReady;
  }
}
