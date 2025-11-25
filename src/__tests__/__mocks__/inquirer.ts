// Mock for inquirer
export default {
  prompt: jest.fn().mockResolvedValue({ confirm: true })
};
