// Mock chalk for Jest tests
const chalk = {
  green: (str: string) => str,
  blue: (str: string) => str,
  yellow: (str: string) => str,
  red: (str: string) => str,
  gray: (str: string) => str,
  cyan: (str: string) => str,
  bold: (str: string) => str,
  dim: (str: string) => str,
};

export default chalk;
