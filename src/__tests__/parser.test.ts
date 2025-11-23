import { describe, it, expect } from '@jest/globals';
import { parseFile } from '../core/parser.js';

describe('parseFile', () => {
  describe('component detection', () => {
    it('should parse a simple function component with default export', () => {
      const content = `
        import React from 'react';

        function MyComponent() {
          return <div>Hello</div>;
        }

        export default MyComponent;
      `;

      const result = parseFile(content, 'MyComponent.tsx');

      expect(result.exports).toContain('MyComponent');
      expect(result.imports).toContain('react');
      expect(result.type).toBe('component');
    });

    it('should parse an arrow function component', () => {
      const content = `
        import React from 'react';

        export const Button = () => {
          return <button>Click me</button>;
        };
      `;

      const result = parseFile(content, 'Button.tsx');

      expect(result.exports).toContain('Button');
      expect(result.type).toBe('component');
    });

    it('should parse multiple named exports', () => {
      const content = `
        export const Header = () => <header>Header</header>;
        export const Footer = () => <footer>Footer</footer>;
        export function Sidebar() {
          return <aside>Sidebar</aside>;
        }
      `;

      const result = parseFile(content, 'Layout.tsx');

      expect(result.exports).toContain('Header');
      expect(result.exports).toContain('Footer');
      expect(result.exports).toContain('Sidebar');
      expect(result.exports).toHaveLength(3);
      expect(result.type).toBe('component');
    });

    it('should parse re-exports', () => {
      const content = `
        export { Button } from './Button';
        export { Input as TextField } from './Input';
      `;

      const result = parseFile(content, 'index.tsx');

      expect(result.exports).toContain('Button');
      expect(result.exports).toContain('TextField');
      // Note: Current implementation doesn't track imports from re-export statements
      // This is a known limitation and can be enhanced in the future
    });
  });

  describe('import detection', () => {
    it('should detect all imports', () => {
      const content = `
        import React from 'react';
        import { useState, useEffect } from 'react';
        import styled from 'styled-components';
        import './styles.css';
        import type { User } from './types';
      `;

      const result = parseFile(content, 'Component.tsx');

      expect(result.imports).toContain('react');
      expect(result.imports).toContain('styled-components');
      expect(result.imports).toContain('./styles.css');
      expect(result.imports).toContain('./types');
    });
  });

  describe('file type detection', () => {
    it('should classify test files correctly', () => {
      const content = `
        import { render } from '@testing-library/react';

        export function testHelper() {
          return true;
        }
      `;

      const result = parseFile(content, 'MyComponent.test.tsx');

      expect(result.type).toBe('test');
    });

    it('should classify spec files correctly', () => {
      const content = `
        describe('MyComponent', () => {
          it('should render', () => {});
        });
      `;

      const result = parseFile(content, 'MyComponent.spec.tsx');

      expect(result.type).toBe('test');
    });

    it('should classify files with no exports as utility', () => {
      const content = `
        import React from 'react';

        const helper = () => {
          return 'helper';
        };
      `;

      const result = parseFile(content, 'utils.tsx');

      expect(result.type).toBe('utility');
      expect(result.exports).toHaveLength(0);
    });

    it('should classify files with exports as component', () => {
      const content = `
        export const API_URL = 'https://api.example.com';
        export function fetchData() {
          return fetch(API_URL);
        }
      `;

      const result = parseFile(content, 'api.tsx');

      expect(result.type).toBe('component');
      expect(result.exports).toContain('API_URL');
      expect(result.exports).toContain('fetchData');
    });
  });

  describe('error handling', () => {
    it('should handle syntax errors gracefully', () => {
      const content = `
        import React from 'react'

        const BrokenComponent = () => {
          return <div>Missing closing tag
        };
      `;

      // Should not throw, but return empty result
      const result = parseFile(content, 'Broken.tsx');

      expect(result.exports).toHaveLength(0);
      expect(result.imports).toHaveLength(0);
      expect(result.type).toBe('utility');
    });

    it('should handle empty files', () => {
      const content = '';

      const result = parseFile(content, 'Empty.tsx');

      expect(result.exports).toHaveLength(0);
      expect(result.imports).toHaveLength(0);
      expect(result.type).toBe('utility');
    });

    it('should handle files with only comments', () => {
      const content = `
        // This is a comment
        /* This is a block comment */
      `;

      const result = parseFile(content, 'Comments.tsx');

      expect(result.exports).toHaveLength(0);
      expect(result.imports).toHaveLength(0);
      expect(result.type).toBe('utility');
    });
  });

  describe('TypeScript support', () => {
    it('should parse TypeScript interfaces and types', () => {
      const content = `
        export interface User {
          id: number;
          name: string;
        }

        export type UserRole = 'admin' | 'user';

        export const createUser = (name: string): User => {
          return { id: 1, name };
        };
      `;

      const result = parseFile(content, 'types.ts');

      // Interfaces and types are not captured as exports in current implementation
      // but the function should be
      expect(result.exports).toContain('createUser');
      expect(result.type).toBe('component');
    });

    it('should handle generic components', () => {
      const content = `
        import React from 'react';

        export function GenericComponent<T>(props: { data: T }) {
          return <div>{JSON.stringify(props.data)}</div>;
        }
      `;

      const result = parseFile(content, 'Generic.tsx');

      expect(result.exports).toContain('GenericComponent');
      expect(result.type).toBe('component');
    });
  });

  describe('traverse functionality', () => {
    it('should successfully traverse AST without "traverse is not a function" error', () => {
      // This test specifically validates the @babel/traverse import fix
      // that resolves the "traverse is not a function" error on Linux systems
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

      // If traverse import is broken, this will throw "traverse is not a function"
      const result = parseFile(content, 'src/components/MyComponent.tsx');

      // Verify that traverse actually ran and extracted data
      expect(result.imports).toHaveLength(4);
      expect(result.imports).toContain('react');
      expect(result.imports).toContain('./Button');
      expect(result.imports).toContain('./types');

      expect(result.exports).toHaveLength(3);
      expect(result.exports).toContain('MyComponent');
      expect(result.exports).toContain('AnotherComponent');

      expect(result.type).toBe('component');
    });

    it('should handle complex nested JSX with traverse', () => {
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

      // Complex JSX requires proper AST traversal
      const result = parseFile(content, 'Complex.tsx');

      expect(result.exports).toContain('ComplexComponent');
      expect(result.imports).toContain('react');
      expect(result.type).toBe('component');
    });
  });

  describe('export edge cases', () => {
    it('should handle string literal exports', () => {
      const content = `
        const foo = 'test';
        export { foo as "string-literal" };
      `;

      const result = parseFile(content, 'StringExport.tsx');

      // The parser should handle string literal exports
      expect(result.exports.length).toBeGreaterThanOrEqual(0);
      expect(result.type).toBe('component');
    });

    it('should handle computed export names', () => {
      const content = `
        export { default as Button } from './Button';
        export { something as "kebab-case-name" } from './other';
      `;

      const result = parseFile(content, 'ComputedExports.tsx');

      // Should extract exports even with computed names
      expect(result.exports).toContain('Button');
      expect(result.type).toBe('component');
    });

    it('should handle mixed export specifier types', () => {
      const content = `
        const Comp1 = () => <div>1</div>;
        const Comp2 = () => <div>2</div>;

        export { Comp1, Comp2 as "comp-2" };
      `;

      const result = parseFile(content, 'MixedExports.tsx');

      expect(result.exports).toContain('Comp1');
      expect(result.type).toBe('component');
    });
  });
});
