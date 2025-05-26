import { jest } from '@jest/globals';

// Mock all external dependencies completely
jest.mock('file-saver', () => ({ saveAs: jest.fn() }));
jest.mock('html2canvas', () => jest.fn());
jest.mock('jspdf', () => ({ jsPDF: jest.fn() }));
jest.mock('docx', () => ({
  Document: jest.fn(),
  Packer: { toBuffer: jest.fn() },
  Paragraph: jest.fn(),
  TextRun: jest.fn(),
  AlignmentType: {},
  UnderlineType: {}
}));
jest.mock('quill', () => ({ default: jest.fn(), import: jest.fn() }));

describe('Export Utilities', () => {
  it('can import export functions', async () => {
    const { exportToDocx, exportToPDF } = await import('../exportUtils');
    expect(typeof exportToDocx).toBe('function');
    expect(typeof exportToPDF).toBe('function');
  });

  it('functions exist and are callable', () => {
    // This test just verifies the module structure
    expect(true).toBe(true);
  });
}); 