/**
 * Icon utilities with Unicode and ASCII fallbacks
 * Automatically detects terminal capabilities
 */

// Check if terminal supports Unicode
const supportsUnicode = (): boolean => {
  // Check environment variables
  const env = process.env;

  if (env.TERM === 'linux' || env.TERM === 'dumb') {
    return false;
  }

  // Check if running in CI
  if (env.CI === 'true' || env.CONTINUOUS_INTEGRATION === 'true') {
    return false;
  }

  // Check locale
  const locale = env.LC_ALL || env.LC_CTYPE || env.LANG || '';
  if (locale.toLowerCase().includes('utf-8') || locale.toLowerCase().includes('utf8')) {
    return true;
  }

  // Default to true for most modern terminals
  return process.platform !== 'win32' || !!env.WT_SESSION || !!env.TERM_PROGRAM;
};

const USE_UNICODE = supportsUnicode();

export const icons = {
  folder: USE_UNICODE ? '📁' : '[DIR]',
  file: USE_UNICODE ? '📄' : '[FILE]',
  test: USE_UNICODE ? '🧪' : '[TEST]',
  checkmark: USE_UNICODE ? '✓' : '[OK]',
  cross: USE_UNICODE ? '✗' : '[X]',
  arrow: USE_UNICODE ? '→' : '->',
  info: USE_UNICODE ? 'ℹ' : '[i]',
  warning: USE_UNICODE ? '⚠' : '[!]',
};

/**
 * Force ASCII mode (for testing or compatibility)
 */
export function forceAsciiMode() {
  icons.folder = '[DIR]';
  icons.file = '[FILE]';
  icons.test = '[TEST]';
  icons.checkmark = '[OK]';
  icons.cross = '[X]';
  icons.arrow = '->';
  icons.info = '[i]';
  icons.warning = '[!]';
}

/**
 * Force Unicode mode
 */
export function forceUnicodeMode() {
  icons.folder = '📁';
  icons.file = '📄';
  icons.test = '🧪';
  icons.checkmark = '✓';
  icons.cross = '✗';
  icons.arrow = '→';
  icons.info = 'ℹ';
  icons.warning = '⚠';
}
