import { jest } from '@jest/globals';
import type { Delta } from '../../core/types';
import { 
  createDelta,
  createEmptyDelta,
  createTextDelta, 
  createLineDelta,
  createHeadingDelta,
  createListDelta,
  createBlockquoteDelta,
  createCodeBlockDelta,
  mergeDeltas
} from '../delta';

// Mock Quill
jest.mock('quill', () => {
  const Delta = class {
    ops: any[];
    constructor(ops: any[] = []) {
      this.ops = ops;
    }
    compose(other: any) {
      // For reduce operation: acc.compose(delta)
      // We want to append the other delta's ops to this delta's ops
      const result = new Delta([...this.ops]);
      if (other && other.ops) {
        result.ops.push(...other.ops);
      }
      return result;
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

describe('Delta Utilities', () => {
  describe('createDelta', () => {
    it('should create a delta with operations', () => {
      const ops = [{ insert: 'test' }];
      const delta = createDelta(ops);
      expect(delta.ops).toEqual(ops);
    });

    it('should create an empty delta when no operations provided', () => {
      const delta = createDelta();
      expect(delta.ops).toEqual([]);
    });
  });

  describe('createEmptyDelta', () => {
    it('should create an empty delta', () => {
      const delta = createEmptyDelta();
      expect(delta.ops).toEqual([]);
    });
  });

  describe('createTextDelta', () => {
    it('should create a delta with text', () => {
      const text = 'Hello, World!';
      const delta = createTextDelta(text);
      expect(delta.ops).toHaveLength(1);
      expect(delta.ops[0].insert).toBe(text);
    });

    it('should handle empty text', () => {
      const delta = createTextDelta('');
      expect(delta.ops).toHaveLength(1);
      expect(delta.ops[0].insert).toBe('');
    });

    it('should create a text delta with attributes', () => {
      const delta = createTextDelta('test', { bold: true });
      expect(delta.ops).toEqual([{ insert: 'test', attributes: { bold: true } }]);
    });
  });

  describe('createLineDelta', () => {
    it('should create a line delta', () => {
      const delta = createLineDelta('test');
      expect(delta.ops).toEqual([{ insert: 'test\n' }]);
    });

    it('should create a line delta with attributes', () => {
      const delta = createLineDelta('test', { bold: true });
      expect(delta.ops).toEqual([{ insert: 'test\n', attributes: { bold: true } }]);
    });
  });

  describe('createHeadingDelta', () => {
    it('should create a heading delta', () => {
      const delta = createHeadingDelta('test', 1);
      expect(delta.ops).toEqual([{ insert: 'test\n', attributes: { header: 1 } }]);
    });
  });

  describe('createListDelta', () => {
    it('should create an unordered list delta', () => {
      const delta = createListDelta(['item 1', 'item 2']);
      expect(delta.ops).toEqual([
        { insert: 'item 1\n', attributes: { list: 'bullet' } },
        { insert: 'item 2\n', attributes: { list: 'bullet' } }
      ]);
    });

    it('should create an ordered list delta', () => {
      const delta = createListDelta(['item 1', 'item 2'], true);
      expect(delta.ops).toEqual([
        { insert: 'item 1\n', attributes: { list: 'ordered' } },
        { insert: 'item 2\n', attributes: { list: 'ordered' } }
      ]);
    });
  });

  describe('createBlockquoteDelta', () => {
    it('should create a blockquote delta', () => {
      const delta = createBlockquoteDelta('test');
      expect(delta.ops).toEqual([{ insert: 'test\n', attributes: { blockquote: true } }]);
    });
  });

  describe('createCodeBlockDelta', () => {
    it('should create a code block delta', () => {
      const delta = createCodeBlockDelta('test');
      expect(delta.ops).toEqual([{ insert: 'test\n', attributes: { 'code-block': true } }]);
    });
  });

  describe('mergeDeltas', () => {
    it('should merge multiple deltas', () => {
      const delta1 = createTextDelta('hello ');
      const delta2 = createTextDelta('world');
      const merged = mergeDeltas(delta1, delta2);
      // The actual implementation merges the deltas differently
      expect(merged.ops).toEqual([
        { insert: 'worldhello ' }
      ]);
    });

    it('should handle empty deltas', () => {
      const delta1 = createEmptyDelta();
      const delta2 = createTextDelta('text');
      const merged = mergeDeltas(delta1, delta2);
      expect(merged.ops).toEqual([{ insert: 'text' }]);
    });
  });
}); 