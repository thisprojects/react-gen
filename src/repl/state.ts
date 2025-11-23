export interface ProjectMap {
  version: string;
  scannedAt: string;
  rootDir: string;
  structure: Record<string, any>;
  files: string[];
  components: string[];
}

export class REPLState {
  public projectMap: ProjectMap | null = null;
  public projectRoot: string | null = null;
  public projectName: string | null = null;
  public isInitialized: boolean = false;

  async setProjectMap(map: ProjectMap) {
    this.projectMap = map;
    this.projectRoot = map.rootDir;
    this.isInitialized = true;

    // Try to extract project name from package.json
    try {
      const fs = await import('fs/promises');
      const path = await import('path');
      const pkgPath = path.default.join(map.rootDir, 'package.json');
      const pkgContent = await fs.default.readFile(pkgPath, 'utf-8');
      const pkg = JSON.parse(pkgContent);
      this.projectName = pkg.name || null;
    } catch {
      // If we can't read package.json, that's okay
      this.projectName = null;
    }
  }

  getComponents(): string[] {
    return this.projectMap?.components || [];
  }

  getFiles(): string[] {
    return this.projectMap?.files || [];
  }

  requiresInit(): boolean {
    return !this.isInitialized;
  }
}
