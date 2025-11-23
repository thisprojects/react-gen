import { REPLState } from '../repl/state.js';
import { TEMPLATES } from './templates.js';

export interface Completion {
  completion: string;
  display?: string;
}

/**
 * Handles tab completion for file references (#), folder references (.),
 * and template references (@)
 */
export class AutoCompleter {
  constructor(private state: REPLState) {}

  /**
   * Main completion method called by readline
   * @param line The current input line
   * @param cursorPos Current cursor position
   * @returns Array of completion strings
   */
  complete(line: string, cursorPos: number): string[] {
    const textBeforeCursor = line.slice(0, cursorPos);

    // Find the token we're completing (look for last #, ., or @)
    const templateMatch = textBeforeCursor.match(/@([a-zA-Z0-9:-]*)$/);
    const fileMatch = textBeforeCursor.match(/#([a-zA-Z0-9_-]*)$/);
    const folderMatch = textBeforeCursor.match(/\.([a-zA-Z0-9._/-]*)$/);

    if (templateMatch) {
      return this.completeTemplate(templateMatch[1]);
    } else if (fileMatch) {
      return this.completeFile(fileMatch[1]);
    } else if (folderMatch) {
      return this.completeFolder(folderMatch[1]);
    }

    return [];
  }

  /**
   * Complete template references (@form:login, @button:primary, etc.)
   */
  completeTemplate(text: string): string[] {
    const matches = TEMPLATES.filter(t => t.startsWith(text));
    return matches.map(t => `@${t}`);
  }

  /**
   * Complete file references (#Button, #LoginForm, etc.)
   * Searches across all files in the project
   */
  completeFile(text: string): string[] {
    if (!this.state.projectMap) return [];

    const searchText = text.toLowerCase();
    const matches: string[] = [];

    // Search through all files
    for (const filePath of this.state.projectMap.files) {
      // Extract filename without extension
      const filename = filePath.split('/').pop()?.replace(/\.(tsx?|jsx?)$/, '') || '';

      if (filename.toLowerCase().includes(searchText)) {
        matches.push(`#${filename}`);
      }
    }

    // Remove duplicates and sort
    return [...new Set(matches)].sort();
  }

  /**
   * Complete folder references (.components, .src.features, etc.)
   * Supports nested paths like .components.forms
   */
  completeFolder(text: string): string[] {
    if (!this.state.projectMap) return [];

    const parts = text.split('.');
    const currentPath = parts.slice(0, -1); // All complete parts
    const searchText = parts[parts.length - 1].toLowerCase(); // What we're typing

    // Navigate to the current folder level
    let currentStructure: any = this.state.projectMap.structure;

    for (const part of currentPath) {
      if (!part) continue;

      if (currentStructure[part]) {
        currentStructure = currentStructure[part];
      } else {
        return []; // Path doesn't exist
      }
    }

    // Get all folders at this level
    const folders = this.getFoldersIn(currentStructure);
    const matches = folders.filter(f => f.toLowerCase().startsWith(searchText));

    // Build the full completion strings
    const prefix = currentPath.length > 0 ? `.${currentPath.join('.')}.` : '.';
    return matches.map(f => `${prefix}${f}`);
  }

  /**
   * Get list of folders at a given structure level
   */
  private getFoldersIn(structure: any): string[] {
    const folders: string[] = [];

    for (const key in structure) {
      const item = structure[key];

      // It's a folder if it doesn't have a 'path' property (which files have)
      if (typeof item === 'object' && !item.path) {
        folders.push(key);
      }
    }

    return folders.sort();
  }

  /**
   * Get files in a specific folder path
   * @param folderPath Dot-separated path like "components.forms"
   */
  getFilesInFolder(folderPath: string): string[] {
    if (!this.state.projectMap) return [];

    const parts = folderPath.split('.').filter(p => p);
    let currentStructure: any = this.state.projectMap.structure;

    // Navigate to the target folder
    for (const part of parts) {
      if (currentStructure[part]) {
        currentStructure = currentStructure[part];
      } else {
        return []; // Path doesn't exist
      }
    }

    // Collect all files at this level
    const files: string[] = [];

    for (const key in currentStructure) {
      const item = currentStructure[key];

      // It's a file if it has a 'path' property
      if (item && typeof item === 'object' && item.path) {
        const filename = item.path.split('/').pop()?.replace(/\.(tsx?|jsx?)$/, '') || '';
        files.push(filename);
      }
    }

    return files.sort();
  }

  /**
   * Resolve a reference to its full file path
   * Examples:
   *   #Button -> src/components/Button.tsx
   *   .components.forms#LoginForm -> src/components/forms/LoginForm.tsx
   */
  resolveReference(reference: string): string | null {
    if (!this.state.projectMap) return null;

    // Parse the reference
    const match = reference.match(/^(\.[\w.]+)?#(\w+)$/);
    if (!match) return null;

    const folderPath = match[1]?.slice(1); // Remove leading .
    const filename = match[2];

    // If no folder path specified, search all files
    if (!folderPath) {
      for (const filePath of this.state.projectMap.files) {
        const file = filePath.split('/').pop()?.replace(/\.(tsx?|jsx?)$/, '');
        if (file === filename) {
          return filePath;
        }
      }
      return null;
    }

    // Search in specific folder
    const parts = folderPath.split('.');
    let currentStructure: any = this.state.projectMap.structure;

    for (const part of parts) {
      if (currentStructure[part]) {
        currentStructure = currentStructure[part];
      } else {
        return null;
      }
    }

    // Look for the file
    for (const key in currentStructure) {
      const item = currentStructure[key];
      if (item && typeof item === 'object' && item.path) {
        const file = item.path.split('/').pop()?.replace(/\.(tsx?|jsx?)$/, '');
        if (file === filename) {
          return item.path;
        }
      }
    }

    return null;
  }
}
