import glob from "fast-glob";
import path from "path";
import fs from "fs/promises";

export interface ScannedFile {
  path: string;
  fullPath: string;
  content: string;
  lines: number;
}

export async function scanProject(rootDir: string): Promise<ScannedFile[]> {
  const patterns = [
    "src/**/*.{tsx,jsx}",
    "components/**/*.{tsx,jsx}",
    "app/**/*.{tsx,jsx}",
  ];

  const filePaths = await glob(patterns, {
    cwd: rootDir,
    ignore: ["**/node_modules/**", "**/dist/**", "**/.next/**", "**/build/**"],
  });

  const files: ScannedFile[] = [];

  for (const filePath of filePaths) {
    const fullPath = path.join(rootDir, filePath);
    const content = await fs.readFile(fullPath, "utf-8");
    const lines = content.split("\n").length;

    files.push({
      path: filePath,
      fullPath,
      content,
      lines,
    });
  }

  return files;
}
