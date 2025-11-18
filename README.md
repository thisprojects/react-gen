# ReactGen

**Interactive React Component Assistant REPL Tool**

ReactGen is a command-line REPL (Read-Eval-Print Loop) tool that helps you explore and understand your React project structure. It scans your React codebase, builds a comprehensive component map, and provides an interactive interface for navigating files and components.

## Features

- 🔍 **Project Scanning**: Automatically discovers all React components (.tsx/.jsx files) in your project
- 📊 **Component Mapping**: Builds a detailed map of your project structure with imports, exports, and relationships
- 🔎 **Interactive Search**: Filter and search through your React files
- 📝 **File Information**: Get detailed information about any component including exports, imports, and usage
- 🎨 **Beautiful CLI**: Colored output with formatted displays and progress indicators

## Installation

### Local Development

```bash
# Clone the repository
git clone <repository-url>
cd react-gen

# Install dependencies
npm install

# Build the project
npm run build

# Run in development mode
npm run dev
```

### Global Installation (Future)

```bash
npm install -g reactgen
```

## Usage

### Starting ReactGen

Launch the REPL from your React project directory:

```bash
npm run dev
# or
node dist/cli.js
```

You'll see the welcome screen and an interactive prompt:

```
╭──────────────────────────────────────────────────────╮
│ ReactGen v1.0                                         │
│ React Component Assistant                            │
│ Interactive REPL Mode                                │
│                                                       │
│ Type /help for available commands                    │
╰──────────────────────────────────────────────────────╯

Initializing...
Ready.

reactgen> _
```

### Available Commands

#### `/init` - Initialize Project Scan

Scans your React project and builds a component map.

```bash
reactgen> /init

⠹ Scanning project structure...
✓ Project scan complete

✓ Found 27 React files
✓ Found 23 components
✓ Project map saved to .reactgen/project-map.json
```

#### `/list [filter]` - List Files

Display all React files in your project, optionally filtered by keyword.

```bash
# List all files
reactgen> /list

Files (27):

📁 src/components/
  📄 Button.tsx
  📄 Card.tsx
  📄 LoginForm.tsx
  🧪 Button.test.tsx

# List files matching a filter
reactgen> /list button

Files (2):

📁 src/components/
  📄 Button.tsx
  🧪 Button.test.tsx
```

#### `/info <filename>` - File Details

Get detailed information about a specific file.

```bash
reactgen> /info Button.tsx

File: src/components/Button.tsx
────────────────────────────────────────────────────────
Lines: 89
Type: component
Exports: Button

Imports:
  - react
  - ./styles.module.css

Used by (3):
  - src/components/LoginForm.tsx
  - src/components/Card.tsx
  - src/pages/Home.tsx
```

#### `/help` - Show Help

Display all available commands and their usage.

```bash
reactgen> /help
```

#### `/clear` - Clear Screen

Clear the terminal screen and redisplay the welcome banner.

```bash
reactgen> /clear
```

#### `/exit` - Exit ReactGen

Exit the REPL session.

```bash
reactgen> /exit

Goodbye!
```

## Project Structure

```
react-gen/
├── src/
│   ├── cli.ts                    # CLI entry point
│   ├── repl/
│   │   ├── repl.ts              # Main REPL loop
│   │   ├── commands.ts          # Command router
│   │   └── state.ts             # State management
│   ├── commands/
│   │   ├── init.ts              # /init command
│   │   ├── list.ts              # /list command
│   │   ├── info.ts              # /info command
│   │   ├── help.ts              # /help command
│   │   └── clear.ts             # /clear command
│   ├── core/
│   │   ├── scanner.ts           # File scanning logic
│   │   ├── parser.ts            # JSX/TSX parsing
│   │   └── mapper.ts            # Project map builder
│   └── utils/
│       └── display.ts           # Display utilities
├── dist/                        # Compiled JavaScript
├── package.json
├── tsconfig.json
└── README.md
```

## Development

### Prerequisites

- Node.js 18+
- npm or yarn
- A React project to test with

### Scripts

```bash
# Development mode (with hot reload)
npm run dev

# Build TypeScript to JavaScript
npm run build

# Run the built CLI
npm start
```

### Architecture

**REPL Loop**: The main loop (`src/repl/repl.ts`) uses Node's `readline` module to create an interactive prompt that accepts commands.

**State Management**: The `REPLState` class maintains the current project map and initialization status across command invocations.

**Command Router**: Commands are parsed and routed in `src/repl/commands.ts`, with individual command implementations in `src/commands/`.

**Project Scanning**: The scanner uses `fast-glob` to find React files, then `@babel/parser` to parse JSX/TSX and extract imports/exports.

**Project Map**: A JSON structure representing the entire project hierarchy is saved to `.reactgen/project-map.json` for reference.

## Phase 1 Implementation

This is Phase 1 of ReactGen, focusing on the core REPL infrastructure and basic file exploration commands.

### ✅ Completed Features

- Interactive REPL with command routing
- Project scanning and mapping
- File listing with filtering
- Detailed file information display
- Graceful error handling
- Clean CLI interface with colors

### 🚧 Future Phases

- **Phase 2**: Tab completion for file/component references
- **Phase 3**: LLM integration for component generation
- **Phase 4**: Advanced refactoring and analysis

## Testing

Test the REPL with a real React project:

```bash
# Navigate to a React project
cd /path/to/your/react/project

# Run ReactGen
/path/to/react-gen/dist/cli.js

# Or use npm link for global access
cd /path/to/react-gen
npm link
cd /path/to/your/react/project
reactgen
```

## Troubleshooting

### "No package.json found"
Make sure you're running ReactGen from the root of a React project that contains a `package.json` file.

### "No React files found"
ReactGen looks for files in `src/`, `components/`, and `app/` directories. Ensure your React files are in one of these locations.

### Parse errors
Some files may fail to parse due to syntax errors or unsupported features. These errors are logged but don't stop the scan.

## License

Apache License 2.0 - See LICENSE file for details.

## Contributing

This is Phase 1 of the project. Contributions are welcome! Please ensure all changes maintain the REPL-first design philosophy.
