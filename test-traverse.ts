/**
 * Test for @babel/traverse import fix
 *
 * This test verifies that the traverse function is properly imported and works
 * without throwing the "traverse is not a function" error that occurs on some
 * Linux systems due to ESM/CommonJS interop issues.
 *
 * Run with: npx tsx test-traverse.ts
 */

import { parseFile } from './src/core/parser.js';

// Test counter
let passed = 0;
let failed = 0;

function test(name: string, fn: () => void) {
  try {
    fn();
    console.log(`✓ ${name}`);
    passed++;
  } catch (error: any) {
    console.error(`✗ ${name}`);
    console.error(`  Error: ${error.message}`);
    failed++;
  }
}

function expect(value: any) {
  return {
    toBe(expected: any) {
      if (value !== expected) {
        throw new Error(`Expected ${expected}, got ${value}`);
      }
    },
    toContain(expected: any) {
      if (!value.includes(expected)) {
        throw new Error(`Expected array to contain ${expected}, got ${JSON.stringify(value)}`);
      }
    },
    toHaveLength(expected: number) {
      if (value.length !== expected) {
        throw new Error(`Expected length ${expected}, got ${value.length}`);
      }
    },
  };
}

console.log('Running @babel/traverse import tests...\n');

test('should successfully traverse AST without "traverse is not a function" error', () => {
  const content = `
    import React from 'react';
    import { useState } from 'react';
    import Button from './Button';
    import type { Props } from './types';

    export const MyComponent = () => {
      const [count, setCount] = useState(0);
      return <div><Button /></div>;
    };

    export function AnotherComponent() {
      return <span>Hello</span>;
    }

    export default MyComponent;
  `;

  const result = parseFile(content, 'src/components/MyComponent.tsx');

  expect(result.imports).toHaveLength(4);
  expect(result.imports).toContain('react');
  expect(result.imports).toContain('./Button');
  expect(result.imports).toContain('./types');
  expect(result.exports).toHaveLength(3);
  expect(result.exports).toContain('MyComponent');
  expect(result.exports).toContain('AnotherComponent');
  expect(result.type).toBe('component');
});

test('should handle complex nested JSX with traverse', () => {
  const content = `
    import React from 'react';

    export const ComplexComponent = () => {
      return (
        <div>
          <header>
            <nav>
              <ul>
                <li><a href="/">Home</a></li>
              </ul>
            </nav>
          </header>
          <main>
            <section>Content</section>
          </main>
        </div>
      );
    };
  `;

  const result = parseFile(content, 'Complex.tsx');

  expect(result.exports).toContain('ComplexComponent');
  expect(result.imports).toContain('react');
  expect(result.type).toBe('component');
});

test('should handle multiple imports and exports', () => {
  const content = `
    import React from 'react';
    import { Component, useState, useEffect } from 'react';
    import axios from 'axios';
    import './styles.css';

    export const Comp1 = () => <div>1</div>;
    export function Comp2() { return <div>2</div>; }
    export default Comp1;
  `;

  const result = parseFile(content, 'MultiExport.tsx');

  expect(result.imports).toHaveLength(4);
  expect(result.exports).toHaveLength(3);
  expect(result.type).toBe('component');
});

console.log(`\n${passed} passed, ${failed} failed`);

if (failed > 0) {
  console.log('\n❌ Some tests failed');
  process.exit(1);
} else {
  console.log('\n✅ All tests passed!');
  console.log('The @babel/traverse import fix is working correctly.');
  process.exit(0);
}
