import * as babel from '@babel/parser';
import * as traverseNamespace from '@babel/traverse';
import * as t from '@babel/types';
import { NodePath } from '@babel/traverse';

// ESM/CommonJS interop - @babel/traverse exports default differently in different environments
// In some environments the function is at .default.default (nested default exports)
// @ts-ignore - Babel traverse has complex module export patterns
const traverse =
  (traverseNamespace as any).default?.default ||
  (traverseNamespace as any).default ||
  traverseNamespace;

export interface ParsedFile {
  exports: string[];
  imports: string[];
  type: 'component' | 'utility' | 'test';
}

export function parseFile(content: string, filePath: string): ParsedFile {
  const result: ParsedFile = {
    exports: [],
    imports: [],
    type: 'utility'
  };

  try {
    const ast = babel.parse(content, {
      sourceType: 'module',
      plugins: ['typescript', 'jsx']
    });

    // Traverse AST to find imports and exports
    traverse(ast, {
      ImportDeclaration(path: NodePath<t.ImportDeclaration>) {
        const source = path.node.source.value;
        result.imports.push(source);
      },

      ExportDefaultDeclaration(path: NodePath<t.ExportDefaultDeclaration>) {
        // Try to get the component name
        if (path.node.declaration.type === 'Identifier') {
          result.exports.push(path.node.declaration.name);
        } else if (path.node.declaration.type === 'FunctionDeclaration') {
          if (path.node.declaration.id) {
            result.exports.push(path.node.declaration.id.name);
          }
        }
      },

      ExportNamedDeclaration(path: NodePath<t.ExportNamedDeclaration>) {
        path.node.specifiers?.forEach((spec: any) => {
          if (spec.type === 'ExportSpecifier') {
            const exportedName = spec.exported.type === 'Identifier'
              ? spec.exported.name
              : spec.exported.value;
            result.exports.push(exportedName);
          }
        });

        // Handle direct export of function/const
        if (path.node.declaration) {
          if (path.node.declaration.type === 'FunctionDeclaration' && path.node.declaration.id) {
            result.exports.push(path.node.declaration.id.name);
          } else if (path.node.declaration.type === 'VariableDeclaration') {
            path.node.declaration.declarations.forEach((decl: any) => {
              if (decl.id.type === 'Identifier') {
                result.exports.push(decl.id.name);
              }
            });
          }
        }
      }
    });

    // Determine file type
    if (filePath.includes('.test.') || filePath.includes('.spec.')) {
      result.type = 'test';
    } else if (result.exports.length > 0) {
      result.type = 'component';
    }

  } catch (error: any) {
    // Silently fail - some files may not parse correctly
    console.error(`Failed to parse ${filePath}: ${error.message}`);
  }

  return result;
}
