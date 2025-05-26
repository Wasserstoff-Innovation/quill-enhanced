import { jest } from '@jest/globals';
import type { Delta as DeltaType, DeltaOperation } from '../../core/types';
import { toMarkdown, fromMarkdown, htmlToMarkdown } from '../markdownUtils';

// Mock Quill
jest.mock('quill', () => {
  const Delta = class {
    ops: DeltaOperation[];
    constructor(ops: DeltaOperation[] = []) {
      this.ops = ops;
    }
    compose(other: DeltaType) {
      return new Delta([...this.ops, ...other.ops]);
    }
  };

  return {
    default: class MockQuill {
      static import() {
        return Delta;
      }
    },
    import: jest.fn().mockReturnValue(Delta)
  };
});

let Delta: any;

beforeAll(async () => {
  const Quill = (await import('quill')).default;
  Delta = Quill.import('delta');
});

describe('Markdown Utilities', () => {
  describe('toMarkdown', () => {
    it('converts basic HTML to Markdown', () => {
      const html = '<h1>Title</h1><p>This is a <strong>bold</strong> paragraph.</p>';
      const result = htmlToMarkdown(html);
      expect(result).toContain('# Title');
      expect(result).toContain('**bold**');
    });

    it('handles lists correctly', () => {
      const html = '<ul><li>Item 1</li><li>Item 2</li></ul>';
      const result = htmlToMarkdown(html);
      // Turndown adds extra spaces, so we check for the pattern
      expect(result).toMatch(/-\s+Item 1/);
      expect(result).toMatch(/-\s+Item 2/);
    });

    it('preserves code blocks', () => {
      const html = '<pre><code>const x = 1;</code></pre>';
      const result = htmlToMarkdown(html);
      expect(result).toContain('const x = 1;');
    });

    it('handles nested lists', () => {
      const html = '<ul><li>Item 1<ul><li>Subitem 1</li><li>Subitem 2</li></ul></li><li>Item 2</li></ul>';
      const result = htmlToMarkdown(html);
      // Check for the general pattern rather than exact spacing
      expect(result).toMatch(/-\s+Item 1/);
      expect(result).toMatch(/-\s+Subitem 1/);
      expect(result).toMatch(/-\s+Subitem 2/);
      expect(result).toMatch(/-\s+Item 2/);
    });

    it('handles blockquotes', () => {
      const html = '<blockquote><p>This is a quote</p></blockquote>';
      const result = htmlToMarkdown(html);
      expect(result).toContain('> This is a quote');
    });
  });

  describe('fromMarkdown', () => {
    it('converts Markdown to Delta', () => {
      const markdown = '# Title\n\nThis is a **bold** paragraph.';
      const delta = fromMarkdown(markdown);
      
      expect(delta.ops).toBeDefined();
      expect(delta.ops.length).toBeGreaterThan(0);
      // Check for header operation
      const headerOp = delta.ops.find((op: DeltaOperation) => op.attributes?.header);
      expect(headerOp).toBeDefined();
      expect(headerOp?.insert).toContain('Title');
    });

    it('handles lists in Markdown', () => {
      const markdown = '- Item 1\n- Item 2';
      const delta = fromMarkdown(markdown);
      
      expect(delta.ops).toBeDefined();
      expect(delta.ops.length).toBeGreaterThan(0);
      // Check for list operations
      const listOps = delta.ops.filter((op: DeltaOperation) => op.attributes?.list);
      expect(listOps.length).toBeGreaterThan(0);
    });

    it('handles code blocks in Markdown', () => {
      const markdown = '```\nconst x = 1;\n```';
      const delta = fromMarkdown(markdown);
      
      // The current implementation may create multiple operations for code blocks
      expect(delta.ops).toBeDefined();
      expect(delta.ops.length).toBeGreaterThan(0);
      // Check that at least one operation has code-block attribute
      const codeOps = delta.ops.filter((op: DeltaOperation) => op.attributes?.['code-block']);
      expect(codeOps.length).toBeGreaterThan(0);
    });

    it('handles blockquotes in Markdown', () => {
      const markdown = '> This is a quote';
      const delta = fromMarkdown(markdown);
      
      expect(delta.ops).toBeDefined();
      expect(delta.ops.length).toBeGreaterThan(0);
      const blockquoteOp = delta.ops.find((op: DeltaOperation) => op.attributes?.blockquote);
      expect(blockquoteOp).toBeDefined();
      expect(blockquoteOp?.insert).toContain('This is a quote');
    });
  });
}); 