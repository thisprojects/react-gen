# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

ReactGen is an interactive REPL (Read-Eval-Print Loop) tool for React component generation and project exploration. It provides a command-line interface for developers to scan, explore, and understand their React project structure.

**Current Status**: Phase 1 Complete - Core REPL infrastructure with project scanning and exploration commands.

## Development Commands

### Build and Run
```bash
# Install dependencies
npm install

# Development mode (with hot reload)
npm run dev

# Build TypeScript to JavaScript
npm run build

# Run the built CLI
npm start
# or
node dist/cli.js
```

### Testing

**Note on Node.js versions**: Jest tests currently have compatibility issues with Node.js v25+ due to localStorage initialization errors. For best results, use Node.js v20 or v22 LTS for running Jest tests, or use the standalone test script.

```bash
# Run all Jest tests (requires Node.js v20 or v22)
npm test

# Run watch mode
npm run test:watch

# Run with coverage
npm run test:coverage

# Run standalone traverse test (works on any Node version including v25)
npm run test:traverse
```

### Testing the REPL
To test ReactGen, you need to run it inside a React project:

```bash
# Navigate to any React project
cd /path/to/react/project

# Run ReactGen from this project
node /path/to/react-gen/dist/cli.js

# Or use npm link for global testing
cd /path/to/react-gen
npm link
cd /path/to/react/project
reactgen
```

## Architecture

### REPL-First Design
ReactGen is a **REPL tool, not a single-command CLI**. Users launch `reactgen` to enter an interactive session, then issue commands like `/init`, `/list`, etc. from within the REPL prompt.

### Core Components

**Entry Point** (`src/cli.ts`):
- Uses `commander` for CLI framework
- Displays welcome banner and launches REPL

**REPL Loop** (`src/repl/repl.ts`):
- Uses Node's `readline` module for interactive prompt
- Handles input, command execution, and graceful exit
- Manages Ctrl+C interrupts (prompts user to use `/exit`)

**State Management** (`src/repl/state.ts`):
- `REPLState` class maintains project map and initialization status
- Persists across command invocations within a session
- Methods: `setProjectMap()`, `getComponents()`, `getFiles()`, `requiresInit()`

**Command Router** (`src/repl/commands.ts`):
- Parses input and routes to command handlers
- Validates command format (must start with `/`)
- Enforces initialization requirements (some commands require `/init` first)

**Commands** (`src/commands/`):
- `/init` - Scans project and builds component map
- `/list [filter]` - Lists files with optional filtering
- `/info <file>` - Shows detailed file information
- `/help` - Displays available commands
- `/clear` - Clears screen and redisplays banner
- `/exit` - Exits REPL

**Core Logic** (`src/core/`):
- `scanner.ts` - Uses `fast-glob` to find .tsx/.jsx files in `src/`, `components/`, `app/` directories
- `parser.ts` - Uses `@babel/parser` with TypeScript and JSX plugins to parse files and extract imports/exports
- `mapper.ts` - Builds nested project structure and saves to `.reactgen/project-map.json`

**Display Utilities** (`src/utils/display.ts`):
- Helper functions for colored terminal output using `chalk`
- Banner display using `boxen`

### Project Map Structure

The project map (`.reactgen/project-map.json`) contains:
```typescript
{
  version: string;           // "1.0"
  scannedAt: string;        // ISO timestamp
  rootDir: string;          // Absolute path to project root
  structure: {              // Nested directory/file structure
    [dir]: {
      [file]: {
        path: string;       // Relative file path
        type: 'component' | 'utility' | 'test';
        lines: number;
        exports: string[];
        imports: string[];
        usedBy: string[];   // Future phase
      }
    }
  };
  files: string[];          // All file paths
  components: string[];     // All exported component names
}
```

## Code Patterns

### File Type Detection
Files are classified as:
- **test**: Contains `.test.` or `.spec.` in filename
- **component**: Has exports
- **utility**: Default if no exports

### Error Handling
- Parser errors are logged but don't stop scanning
- Commands requiring initialization display warning if run before `/init`
- Invalid commands show helpful error messages

### TypeScript Configuration
- Target: ES2022
- Module: ES2022 (ESM)
- Strict mode enabled
- Output: `dist/` directory
- The CLI entry point preserves the shebang `#!/usr/bin/env node`

## Dependencies

**Production**:
- `commander` - CLI framework
- `chalk` - Terminal colors
- `ora` - Spinners/progress indicators
- `boxen` - Terminal boxes
- `cli-table3` - Tables (currently unused)
- `fast-glob` - Fast file pattern matching
- `@babel/parser` - Parse JSX/TSX
- `@babel/traverse` - AST traversal

**Development**:
- `typescript` - TypeScript compiler
- `tsx` - TypeScript execution and watch mode
- `@types/node` - Node.js types
- `@types/babel__traverse` - Babel traverse types

## Phase 1 Scope

### Implemented
- Interactive REPL with command routing
- Project scanning (finds .tsx/.jsx in src/, components/, app/)
- JSX/TSX parsing with Babel
- Project map generation and persistence
- All core commands (/init, /list, /info, /help, /clear, /exit)
- Colored output and formatted display
- Graceful error handling

### Not Yet Implemented
- Tab completion (Phase 2)
- File reference shortcuts like `#Button` (Phase 2)
- LLM integration (Phase 3)
- Component generation (Phase 3)
- Refactoring tools (Phase 4)
- Usage tracking (finding where components are used)

## Known Limitations

1. **File Discovery**: Only scans `src/`, `components/`, and `app/` directories
2. **Parse Errors**: Some files with syntax errors or advanced features may fail to parse
3. **Usage Tracking**: The `usedBy` field is not yet populated (Phase 2)
4. **Memory**: Large projects (1000+ files) may slow down scanning
5. **Jest on Node.js v25+**: Jest tests fail with localStorage errors on Node v25+. Use Node v20/v22 LTS for Jest, or run `npm run test:traverse` which works on all Node versions.

## Fixed Issues

### @babel/traverse "is not a function" Error
**Issue**: On some Linux systems, running `/init` would fail with "traverse is not a function" error.

**Root Cause**: In ES module environments, `@babel/traverse` exports its default function in a nested structure (`traverseNamespace.default.default`). The module export pattern differs between macOS and Linux due to how Node.js resolves ES modules.

**Fix**: The parser now checks for the function at multiple locations:
```typescript
const traverse =
  (traverseNamespace as any).default?.default ||  // Nested default (Linux)
  (traverseNamespace as any).default ||           // Single default (macOS)
  traverseNamespace;                               // Fallback
```

**Test Coverage**: Added specific tests in `src/__tests__/parser.test.ts` under the "traverse functionality" section and a standalone test script `test-traverse.ts` that verifies:
- AST traversal works without errors
- Complex JSX parsing works correctly
- Multiple imports and exports are properly extracted

## Future Development Notes

### Phase 2 (Next)
- Add tab completion for file references
- Implement file reference shortcuts (`#Button`, `.components/`)
- Add progressive path completion
- Implement usage tracking to populate `usedBy`

### Phase 3
- LLM integration for component generation
- Natural language command processing
- Smart component suggestions

## Testing Checklist

When making changes, test:
1. Launch REPL - should show welcome banner and prompt
2. `/help` - should display all commands
3. `/init` without React project - should show error about package.json
4. `/init` in React project - should scan and show results
5. `/list` - should show all files grouped by directory
6. `/list <filter>` - should filter results
7. `/info <file>` - should show file details
8. Invalid command - should show helpful error
9. Command without `/` - should prompt to use `/`
10. `/clear` - should clear and redisplay banner
11. `/exit` - should exit cleanly
12. Ctrl+C - should show message about `/exit` and stay in REPL

## License

Apache License 2.0
