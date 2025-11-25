// Mock for ollama
export class Ollama {
  private config: any;

  constructor(config?: any) {
    this.config = config;
  }

  async list() {
    return {
      models: [
        { name: 'qwen2.5-coder:14b' },
        { name: 'test-model' }
      ]
    };
  }

  async generate(options: any) {
    // Return a basic component that includes the requested component name if provided
    const componentName = options.prompt && options.prompt.match(/COMPONENT NAME: (\w+)/)?.[1] || 'TestComponent';

    return {
      response: `export default function ${componentName}() {
  return <div>${componentName}</div>;
}`
    };
  }
}
