import { OllamaClient } from './ollama-client.js';
import { getTemplate } from '../template-code.js';

export interface GenerationOptions {
  template: string;
  componentName: string;
  customization?: string;
  context?: string;
}

export class ComponentGenerator {
  constructor(private ollama: OllamaClient) {}

  /**
   * Generate a component using template + optional LLM customization
   */
  async generate(options: GenerationOptions): Promise<string> {
    const { template, componentName, customization, context } = options;

    // Get base template code
    const baseTemplate = getTemplate(template);

    if (!baseTemplate) {
      throw new Error(`Template not found: ${template}`);
    }

    // If no customization needed, return template with name change
    if (!customization || customization.trim().length === 0) {
      return this.applyComponentName(baseTemplate, componentName);
    }

    // Use LLM to customize template
    const prompt = this.buildCustomizationPrompt(
      baseTemplate,
      componentName,
      customization,
      context
    );

    const result = await this.ollama.generate(prompt, {
      temperature: 0.7,
      maxTokens: 1500
    });

    // Extract code from response
    const code = this.extractCode(result);

    return code;
  }

  /**
   * Build prompt for Ollama to customize template
   */
  private buildCustomizationPrompt(
    template: string,
    componentName: string,
    customization: string,
    context?: string
  ): string {
    return `You are a React/TypeScript code generator. Your task is to modify a component template based on requirements.

TEMPLATE:
\`\`\`tsx
${template}
\`\`\`

COMPONENT NAME: ${componentName}

REQUIREMENTS:
${customization}

${context ? `CONTEXT:\n${context}\n` : ''}

INSTRUCTIONS:
- Return ONLY the complete TypeScript/React code
- Do NOT include explanations or markdown code fences
- Change the component name to ${componentName}
- Apply the requested customizations
- Keep all TypeScript types
- Maintain accessibility features (ARIA attributes, keyboard navigation)
- Use Tailwind CSS for styling
- Keep error handling and validation
- Export as default

IMPORTANT: Output only code, starting with import statements.

CODE:`;
  }

  /**
   * Extract code from LLM response
   */
  private extractCode(response: string): string {
    let code = response.trim();

    // Remove markdown code blocks if present
    code = code.replace(/^```(?:tsx|typescript|jsx|ts|js)?\s*/gm, '');
    code = code.replace(/```\s*$/gm, '');

    // If response starts with explanation, try to find where code starts
    if (!code.startsWith('import') && !code.startsWith('\'use client\'') && !code.startsWith('"use client"')) {
      const lines = code.split('\n');
      const codeStartIndex = lines.findIndex(line =>
        line.startsWith('import') ||
        line.startsWith('\'use client\'') ||
        line.startsWith('"use client"')
      );

      if (codeStartIndex !== -1) {
        code = lines.slice(codeStartIndex).join('\n');
      }
    }

    return code.trim();
  }

  /**
   * Apply component name to template
   */
  private applyComponentName(code: string, name: string): string {
    // Replace export default function NAME
    code = code.replace(
      /export default function \w+/,
      `export default function ${name}`
    );

    // Replace interface NAMEProps
    code = code.replace(
      /interface \w+Props/,
      `interface ${name}Props`
    );

    return code;
  }
}
