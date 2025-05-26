interface MarkedFunction {
  (text: string): string;
  parse: (text: string) => string;
}

const marked = jest.fn((text: string) => text);
Object.defineProperty(marked, 'parse', {
  value: jest.fn((text: string) => text),
  writable: true
});

export { marked };
export default marked; 