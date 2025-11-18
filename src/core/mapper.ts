import { scanProject, ScannedFile } from './scanner.js';
import { parseFile } from './parser.js';

export interface ProjectMap {
  version: string;
  scannedAt: string;
  rootDir: string;
  structure: Record<string, any>;
  files: string[];
  components: string[];
}

export async function buildProjectMap(
  rootDir: string
): Promise<ProjectMap> {
  const scannedFiles = await scanProject(rootDir);
  const structure: Record<string, any> = {};
  const components: string[] = [];
  const allFiles: string[] = [];

  for (const file of scannedFiles) {
    const parsed = parseFile(file.content, file.path);

    // Build nested structure
    const parts = file.path.split('/');
    let current = structure;

    for (let i = 0; i < parts.length - 1; i++) {
      const part = parts[i];
      if (!current[part]) {
        current[part] = {};
      }
      current = current[part];
    }

    const fileName = parts[parts.length - 1];
    current[fileName] = {
      path: file.path,
      type: parsed.type,
      lines: file.lines,
      exports: parsed.exports,
      imports: parsed.imports,
      usedBy: [] // Will be populated in future phases
    };

    allFiles.push(file.path);

    // Track components
    if (parsed.type === 'component' && parsed.exports.length > 0) {
      components.push(...parsed.exports);
    }
  }

  return {
    version: '1.0',
    scannedAt: new Date().toISOString(),
    rootDir,
    structure,
    files: allFiles,
    components
  };
}
