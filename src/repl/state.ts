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
  public isInitialized: boolean = false;

  setProjectMap(map: ProjectMap) {
    this.projectMap = map;
    this.projectRoot = map.rootDir;
    this.isInitialized = true;
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
