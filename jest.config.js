export default {
  preset: 'ts-jest/presets/default-esm',
  testEnvironment: 'node',
  testEnvironmentOptions: {
    customExportConditions: ['node', 'node-addons'],
  },
  extensionsToTreatAsEsm: ['.ts'],
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1',
    '^chalk$': '<rootDir>/src/__tests__/__mocks__/chalk.ts',
    '^ora$': '<rootDir>/src/__tests__/__mocks__/ora.ts',
    '^boxen$': '<rootDir>/src/__tests__/__mocks__/boxen.ts',
    '^inquirer$': '<rootDir>/src/__tests__/__mocks__/inquirer.ts',
    '^ollama$': '<rootDir>/src/__tests__/__mocks__/ollama.ts',
  },
  transformIgnorePatterns: [
    'node_modules/(?!(chalk|boxen|ora|cli-spinners|strip-ansi|ansi-regex|ansi-styles|is-interactive|is-unicode-supported|log-symbols|wrap-ansi|string-width|emoji-regex|strip-ansi)/)',
  ],
  transform: {
    '^.+\\.tsx?$': [
      'ts-jest',
      {
        useESM: true,
      },
    ],
  },
  testMatch: [
    '**/__tests__/**/*.test.ts'
  ],
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/cli.ts', // Exclude CLI entry point from coverage
    '!src/repl/repl.ts', // Exclude interactive REPL loop (better suited for integration tests)
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
};
