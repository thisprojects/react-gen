// Available templates - will be populated from template-code.ts
const AVAILABLE_TEMPLATES = [
  'form:login',
  'form:signup',
  'form:contact',
  'button:primary',
  'card:simple',
  'modal:confirm'
];

export interface ParsedRequest {
  components: ComponentReference[];
  description: string;
  rawInput: string;
}

export interface ComponentReference {
  symbol: string;        // e.g., "@login", "@card", "@button"
  template: string;      // e.g., "form:login", "card:simple", "button:primary"
  count: number;         // How many of this component (default 1)
  context: string;       // Surrounding text for context
}

/**
 * Parses natural language requests with @component references
 * Example: "make me a @login page with three @card components"
 */
export class RequestParser {

  /**
   * Parse a request to extract @component references
   */
  parse(input: string): ParsedRequest {
    const components: ComponentReference[] = [];

    // Find all @references
    const matches = input.matchAll(/@([\w:]+)/g);
    const foundReferences = new Set<string>();

    for (const match of matches) {
      const symbol = match[0];  // @login
      const reference = match[1]; // login or form:login

      // Skip duplicates
      if (foundReferences.has(symbol)) continue;
      foundReferences.add(symbol);

      // Map to template
      const template = this.mapToTemplate(reference);

      if (template) {
        // Extract count if mentioned
        const count = this.extractCount(input, symbol);

        // Get context around this reference
        const context = this.extractContext(input, match.index!);

        components.push({
          symbol,
          template,
          count,
          context
        });
      }
    }

    return {
      components,
      description: input,
      rawInput: input
    };
  }

  /**
   * Map @reference to template name
   * Examples:
   *   @login -> form:login
   *   @form:login -> form:login
   *   @card -> card:simple
   *   @button -> button:primary
   */
  private mapToTemplate(reference: string): string | null {
    // If already a full template reference, return as-is
    if (reference.includes(':')) {
      return AVAILABLE_TEMPLATES.includes(reference) ? reference : null;
    }

    // Map short names to templates
    const shorthandMap: Record<string, string> = {
      'login': 'form:login',
      'signup': 'form:signup',
      'register': 'form:signup',
      'contact': 'form:contact',
      'search': 'form:search',
      'button': 'button:primary',
      'btn': 'button:primary',
      'card': 'card:simple',
      'modal': 'modal:confirm',
      'dialog': 'modal:confirm',
      'nav': 'nav:header',
      'navbar': 'nav:header',
      'header': 'nav:header',
      'sidebar': 'nav:sidebar',
      'footer': 'nav:header'  // Can customize in prompt
    };

    return shorthandMap[reference.toLowerCase()] || null;
  }

  /**
   * Extract count from context
   * Examples: "three @card components" -> 3
   */
  private extractCount(input: string, symbol: string): number {
    const symbolIndex = input.indexOf(symbol);

    // Look in ~30 chars before the symbol
    const contextBefore = input.slice(Math.max(0, symbolIndex - 30), symbolIndex).toLowerCase();

    // Number words
    const numbers: Record<string, number> = {
      'one': 1, 'two': 2, 'three': 3, 'four': 4, 'five': 5,
      'six': 6, 'seven': 7, 'eight': 8, 'nine': 9, 'ten': 10
    };

    for (const [word, num] of Object.entries(numbers)) {
      if (contextBefore.includes(word)) {
        return num;
      }
    }

    // Look for digits
    const digitMatch = contextBefore.match(/(\d+)/);
    if (digitMatch) {
      return parseInt(digitMatch[1], 10);
    }

    return 1;
  }

  /**
   * Extract context around a reference
   */
  private extractContext(input: string, index: number): string {
    const start = Math.max(0, index - 50);
    const end = Math.min(input.length, index + 50);
    return input.slice(start, end).trim();
  }

  /**
   * Validate that request has at least one valid component
   */
  isValid(parsed: ParsedRequest): boolean {
    return parsed.components.length > 0;
  }

  /**
   * Get help text for invalid requests
   */
  getHelpText(parsed: ParsedRequest): string {
    if (parsed.components.length === 0) {
      return 'No valid @components found. Available: @login, @signup, @button, @card, @modal, @nav';
    }
    return '';
  }
}
