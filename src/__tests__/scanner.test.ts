import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { scanProject } from '../core/scanner.js';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';

describe('scanProject', () => {
  let tempDir: string;

  beforeEach(async () => {
    // Create a temporary directory for testing
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'reactgen-test-'));
  });

  afterEach(async () => {
    // Clean up temporary directory
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  it('should find .tsx files in src directory', async () => {
    const srcDir = path.join(tempDir, 'src');
    await fs.mkdir(srcDir, { recursive: true });
    await fs.writeFile(
      path.join(srcDir, 'Component.tsx'),
      'export const Component = () => <div>Test</div>;'
    );

    const files = await scanProject(tempDir);

    expect(files).toHaveLength(1);
    expect(files[0].path).toBe('src/Component.tsx');
    expect(files[0].content).toContain('Component');
  });

  it('should find .jsx files in src directory', async () => {
    const srcDir = path.join(tempDir, 'src');
    await fs.mkdir(srcDir, { recursive: true });
    await fs.writeFile(
      path.join(srcDir, 'OldComponent.jsx'),
      'export const OldComponent = () => <div>Old</div>;'
    );

    const files = await scanProject(tempDir);

    expect(files).toHaveLength(1);
    expect(files[0].path).toBe('src/OldComponent.jsx');
  });

  it('should find files in components directory', async () => {
    const componentsDir = path.join(tempDir, 'components');
    await fs.mkdir(componentsDir, { recursive: true });
    await fs.writeFile(
      path.join(componentsDir, 'Button.tsx'),
      'export const Button = () => <button>Click</button>;'
    );

    const files = await scanProject(tempDir);

    expect(files).toHaveLength(1);
    expect(files[0].path).toBe('components/Button.tsx');
  });

  it('should find files in app directory', async () => {
    const appDir = path.join(tempDir, 'app');
    await fs.mkdir(appDir, { recursive: true });
    await fs.writeFile(
      path.join(appDir, 'page.tsx'),
      'export default function Page() { return <div>Page</div>; }'
    );

    const files = await scanProject(tempDir);

    expect(files).toHaveLength(1);
    expect(files[0].path).toBe('app/page.tsx');
  });

  it('should find files in nested directories', async () => {
    const nestedDir = path.join(tempDir, 'src', 'components', 'ui');
    await fs.mkdir(nestedDir, { recursive: true });
    await fs.writeFile(
      path.join(nestedDir, 'Input.tsx'),
      'export const Input = () => <input />;'
    );

    const files = await scanProject(tempDir);

    expect(files).toHaveLength(1);
    expect(files[0].path).toBe('src/components/ui/Input.tsx');
  });

  it('should find multiple files across different directories', async () => {
    await fs.mkdir(path.join(tempDir, 'src'), { recursive: true });
    await fs.mkdir(path.join(tempDir, 'components'), { recursive: true });
    await fs.mkdir(path.join(tempDir, 'app'), { recursive: true });

    await fs.writeFile(
      path.join(tempDir, 'src', 'App.tsx'),
      'export const App = () => <div>App</div>;'
    );
    await fs.writeFile(
      path.join(tempDir, 'components', 'Header.tsx'),
      'export const Header = () => <header>Header</header>;'
    );
    await fs.writeFile(
      path.join(tempDir, 'app', 'layout.tsx'),
      'export default function Layout() { return <div>Layout</div>; }'
    );

    const files = await scanProject(tempDir);

    expect(files).toHaveLength(3);
    expect(files.map(f => f.path).sort()).toEqual([
      'app/layout.tsx',
      'components/Header.tsx',
      'src/App.tsx'
    ]);
  });

  it('should ignore node_modules directory', async () => {
    const nodeModulesDir = path.join(tempDir, 'node_modules', 'some-package');
    await fs.mkdir(nodeModulesDir, { recursive: true });
    await fs.writeFile(
      path.join(nodeModulesDir, 'Component.tsx'),
      'export const Component = () => <div>Test</div>;'
    );

    const files = await scanProject(tempDir);

    expect(files).toHaveLength(0);
  });

  it('should ignore dist directory', async () => {
    const distDir = path.join(tempDir, 'dist');
    await fs.mkdir(distDir, { recursive: true });
    await fs.writeFile(
      path.join(distDir, 'Component.tsx'),
      'export const Component = () => <div>Test</div>;'
    );

    const files = await scanProject(tempDir);

    expect(files).toHaveLength(0);
  });

  it('should ignore build directory', async () => {
    const buildDir = path.join(tempDir, 'build');
    await fs.mkdir(buildDir, { recursive: true });
    await fs.writeFile(
      path.join(buildDir, 'Component.tsx'),
      'export const Component = () => <div>Test</div>;'
    );

    const files = await scanProject(tempDir);

    expect(files).toHaveLength(0);
  });

  it('should ignore .next directory', async () => {
    const nextDir = path.join(tempDir, '.next');
    await fs.mkdir(nextDir, { recursive: true });
    await fs.writeFile(
      path.join(nextDir, 'Component.tsx'),
      'export const Component = () => <div>Test</div>;'
    );

    const files = await scanProject(tempDir);

    expect(files).toHaveLength(0);
  });

  it('should count lines correctly', async () => {
    const srcDir = path.join(tempDir, 'src');
    await fs.mkdir(srcDir, { recursive: true });
    const content = `line 1
line 2
line 3
line 4
line 5`;
    await fs.writeFile(path.join(srcDir, 'Component.tsx'), content);

    const files = await scanProject(tempDir);

    expect(files[0].lines).toBe(5);
  });

  it('should return empty array when no matching files exist', async () => {
    // Create directories but no files
    await fs.mkdir(path.join(tempDir, 'src'), { recursive: true });

    const files = await scanProject(tempDir);

    expect(files).toHaveLength(0);
  });

  it('should include full path and relative path', async () => {
    const srcDir = path.join(tempDir, 'src');
    await fs.mkdir(srcDir, { recursive: true });
    await fs.writeFile(
      path.join(srcDir, 'Component.tsx'),
      'export const Component = () => <div>Test</div>;'
    );

    const files = await scanProject(tempDir);

    expect(files[0].path).toBe('src/Component.tsx');
    expect(files[0].fullPath).toBe(path.join(tempDir, 'src', 'Component.tsx'));
  });

  it('should not find .ts files (only .tsx and .jsx)', async () => {
    const srcDir = path.join(tempDir, 'src');
    await fs.mkdir(srcDir, { recursive: true });
    await fs.writeFile(
      path.join(srcDir, 'utils.ts'),
      'export const helper = () => "help";'
    );

    const files = await scanProject(tempDir);

    expect(files).toHaveLength(0);
  });

  it('should not find .js files (only .tsx and .jsx)', async () => {
    const srcDir = path.join(tempDir, 'src');
    await fs.mkdir(srcDir, { recursive: true });
    await fs.writeFile(
      path.join(srcDir, 'config.js'),
      'export const config = {};'
    );

    const files = await scanProject(tempDir);

    expect(files).toHaveLength(0);
  });
});
