const turndown = jest.fn((html: string) => html);

const TurndownService = jest.fn().mockImplementation(() => ({
  turndown
}));

export { turndown };
export default TurndownService; 