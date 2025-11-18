import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { buildProjectMap } from '../core/mapper.js';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';

describe('buildProjectMap', () => {
  let tempDir: string;

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'reactgen-mapper-test-'));
  });

  afterEach(async () => {
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  it('should build a project map with basic structure', async () => {
    const srcDir = path.join(tempDir, 'src');
    await fs.mkdir(srcDir, { recursive: true });
    await fs.writeFile(
      path.join(srcDir, 'App.tsx'),
      'export const App = () => <div>App</div>;'
    );

    const projectMap = await buildProjectMap(tempDir);

    expect(projectMap.version).toBe('1.0');
    expect(projectMap.rootDir).toBe(tempDir);
    expect(projectMap.files).toEqual(['src/App.tsx']);
    expect(projectMap.components).toContain('App');
    expect(projectMap.scannedAt).toBeDefined();
  });

  it('should create nested directory structure', async () => {
    const nestedDir = path.join(tempDir, 'src', 'components', 'ui');
    await fs.mkdir(nestedDir, { recursive: true });
    await fs.writeFile(
      path.join(nestedDir, 'Button.tsx'),
      'export const Button = () => <button>Click</button>;'
    );

    const projectMap = await buildProjectMap(tempDir);

    expect(projectMap.structure.src).toBeDefined();
    expect(projectMap.structure.src.components).toBeDefined();
    expect(projectMap.structure.src.components.ui).toBeDefined();
    expect(projectMap.structure.src.components.ui['Button.tsx']).toBeDefined();
  });

  it('should include file metadata in structure', async () => {
    const srcDir = path.join(tempDir, 'src');
    await fs.mkdir(srcDir, { recursive: true });
    const content = `import React from 'react';

export const Header = () => {
  return <header>Header</header>;
};`;
    await fs.writeFile(path.join(srcDir, 'Header.tsx'), content);

    const projectMap = await buildProjectMap(tempDir);

    const fileInfo = projectMap.structure.src['Header.tsx'];
    expect(fileInfo.path).toBe('src/Header.tsx');
    expect(fileInfo.type).toBe('component');
    expect(fileInfo.lines).toBe(5);
    expect(fileInfo.exports).toContain('Header');
    expect(fileInfo.imports).toContain('react');
    expect(fileInfo.usedBy).toEqual([]);
  });

  it('should track all component exports', async () => {
    const srcDir = path.join(tempDir, 'src');
    await fs.mkdir(srcDir, { recursive: true });

    await fs.writeFile(
      path.join(srcDir, 'Components.tsx'),
      `export const Button = () => <button>Button</button>;
export const Input = () => <input />;
export const Select = () => <select></select>;`
    );

    const projectMap = await buildProjectMap(tempDir);

    expect(projectMap.components).toContain('Button');
    expect(projectMap.components).toContain('Input');
    expect(projectMap.components).toContain('Select');
    expect(projectMap.components).toHaveLength(3);
  });

  it('should not track non-component files as components', async () => {
    const srcDir = path.join(tempDir, 'src');
    await fs.mkdir(srcDir, { recursive: true });

    // File with no exports (utility)
    await fs.writeFile(
      path.join(srcDir, 'utils.tsx'),
      'const helper = () => "help";'
    );

    const projectMap = await buildProjectMap(tempDir);

    expect(projectMap.components).toHaveLength(0);
    expect(projectMap.files).toContain('src/utils.tsx');
    expect(projectMap.structure.src['utils.tsx'].type).toBe('utility');
  });

  it('should handle multiple files across different directories', async () => {
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
      path.join(tempDir, 'app', 'page.tsx'),
      'export default function Page() { return <div>Page</div>; }'
    );

    const projectMap = await buildProjectMap(tempDir);

    expect(projectMap.files).toHaveLength(3);
    expect(projectMap.structure.src).toBeDefined();
    expect(projectMap.structure.components).toBeDefined();
    expect(projectMap.structure.app).toBeDefined();
  });

  it('should handle test files correctly', async () => {
    const srcDir = path.join(tempDir, 'src');
    await fs.mkdir(srcDir, { recursive: true });

    await fs.writeFile(
      path.join(srcDir, 'Button.test.tsx'),
      'export const testHelper = () => true;'
    );

    const projectMap = await buildProjectMap(tempDir);

    expect(projectMap.structure.src['Button.test.tsx'].type).toBe('test');
    // Test files should not add exports to components list
    expect(projectMap.components).toHaveLength(0);
  });

  it('should return empty project map for empty project', async () => {
    await fs.mkdir(path.join(tempDir, 'src'), { recursive: true });

    const projectMap = await buildProjectMap(tempDir);

    expect(projectMap.files).toHaveLength(0);
    expect(projectMap.components).toHaveLength(0);
    expect(projectMap.structure).toEqual({});
  });

  it('should handle files with same name in different directories', async () => {
    await fs.mkdir(path.join(tempDir, 'src', 'components'), { recursive: true });
    await fs.mkdir(path.join(tempDir, 'src', 'pages'), { recursive: true });

    await fs.writeFile(
      path.join(tempDir, 'src', 'components', 'Button.tsx'),
      'export const Button = () => <button>Component</button>;'
    );
    await fs.writeFile(
      path.join(tempDir, 'src', 'pages', 'Button.tsx'),
      'export const Button = () => <button>Page</button>;'
    );

    const projectMap = await buildProjectMap(tempDir);

    expect(projectMap.files).toHaveLength(2);
    expect(projectMap.structure.src.components['Button.tsx']).toBeDefined();
    expect(projectMap.structure.src.pages['Button.tsx']).toBeDefined();
    expect(projectMap.components).toHaveLength(2); // Both Button exports tracked
  });

  it('should handle deeply nested structures', async () => {
    const deepPath = path.join(tempDir, 'src', 'features', 'auth', 'components', 'forms');
    await fs.mkdir(deepPath, { recursive: true });

    await fs.writeFile(
      path.join(deepPath, 'LoginForm.tsx'),
      'export const LoginForm = () => <form>Login</form>;'
    );

    const projectMap = await buildProjectMap(tempDir);

    expect(projectMap.files[0]).toBe('src/features/auth/components/forms/LoginForm.tsx');
    expect(projectMap.structure.src.features.auth.components.forms['LoginForm.tsx']).toBeDefined();
  });

  it('should track imports correctly', async () => {
    const srcDir = path.join(tempDir, 'src');
    await fs.mkdir(srcDir, { recursive: true });

    await fs.writeFile(
      path.join(srcDir, 'App.tsx'),
      `import React from 'react';
import { useState } from 'react';
import './App.css';

export const App = () => <div>App</div>;`
    );

    const projectMap = await buildProjectMap(tempDir);

    const fileInfo = projectMap.structure.src['App.tsx'];
    expect(fileInfo.imports).toContain('react');
    expect(fileInfo.imports).toContain('./App.css');
  });

  it('should initialize usedBy as empty array', async () => {
    const srcDir = path.join(tempDir, 'src');
    await fs.mkdir(srcDir, { recursive: true });

    await fs.writeFile(
      path.join(srcDir, 'Component.tsx'),
      'export const Component = () => <div>Test</div>;'
    );

    const projectMap = await buildProjectMap(tempDir);

    expect(projectMap.structure.src['Component.tsx'].usedBy).toEqual([]);
  });

  it('should set correct timestamp', async () => {
    const srcDir = path.join(tempDir, 'src');
    await fs.mkdir(srcDir, { recursive: true });
    await fs.writeFile(
      path.join(srcDir, 'App.tsx'),
      'export const App = () => <div>App</div>;'
    );

    const before = new Date().toISOString();
    const projectMap = await buildProjectMap(tempDir);
    const after = new Date().toISOString();

    expect(projectMap.scannedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
    expect(projectMap.scannedAt >= before).toBe(true);
    expect(projectMap.scannedAt <= after).toBe(true);
  });
});
