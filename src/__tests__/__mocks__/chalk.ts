// Mock chalk for Jest tests
const createChainableChalk = () => {
  const colorFn = (str: string) => str;

  // Add all color methods to the function
  colorFn.green = colorFn;
  colorFn.blue = colorFn;
  colorFn.yellow = colorFn;
  colorFn.red = colorFn;
  colorFn.gray = colorFn;
  colorFn.cyan = colorFn;
  colorFn.bold = colorFn;
  colorFn.dim = colorFn;

  return colorFn;
};

const chalk = createChainableChalk();

export default chalk;
