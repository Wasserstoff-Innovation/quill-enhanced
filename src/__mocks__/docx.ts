export const Document = jest.fn().mockImplementation(() => ({
  save: jest.fn().mockResolvedValue(new ArrayBuffer(0))
}));

export default {
  Document
}; 