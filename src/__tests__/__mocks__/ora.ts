// Mock ora for Jest tests
export default function ora() {
  return {
    start: () => ({ succeed: () => {}, fail: () => {}, stop: () => {}, warn: () => {} }),
    succeed: () => {},
    fail: () => {},
    stop: () => {},
    warn: () => {},
  };
}
