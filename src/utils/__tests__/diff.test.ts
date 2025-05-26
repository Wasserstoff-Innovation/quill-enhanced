import { jest } from '@jest/globals';
import type { Delta } from '../../core/types';
import { getDiff, applyDiff, computeDiff, createUnifiedDiff } from '../diffUtils';

// Mock Quill
jest.mock('quill', () => {
  const Delta = class {
    ops: any[];
    constructor(ops: any[] = []) {
      this.ops = ops;
    }
    diff(other: any) {
      // Simple diff implementation for testing
      return new Delta([{ retain: this.ops.length }, ...other.ops]);
    }
    compose(other: any) {
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

describe('Diff Utilities', () => {
  let Delta: any;

  beforeAll(async () => {
    const Quill = (await import('quill')).default;
    Delta = Quill.import('delta');
  });

  describe('getDiff', () => {
    it('creates a diff between two deltas', () => {
      const oldDelta = new Delta([{ insert: 'Hello' }]);
      const newDelta = new Delta([{ insert: 'Hello World' }]);
      
      const diff = getDiff(oldDelta, newDelta);
      expect(diff).toBeDefined();
      expect(diff.ops).toBeDefined();
    });

    it('handles identical deltas', () => {
      const delta = new Delta([{ insert: 'Hello' }]);
      const diff = getDiff(delta, delta);
      expect(diff).toBeDefined();
      expect(diff.ops).toBeDefined();
    });

    it('handles empty deltas', () => {
      const emptyDelta = new Delta();
      const textDelta = new Delta([{ insert: 'Hello' }]);
      
      const diff = getDiff(emptyDelta, textDelta);
      expect(diff).toBeDefined();
      expect(diff.ops).toBeDefined();
    });
  });

  describe('applyDiff', () => {
    it('applies a diff to a delta', () => {
      const baseDelta = new Delta([{ insert: 'Hello' }]);
      const diff = new Delta([{ insert: ' World' }]);
      
      const result = applyDiff(baseDelta, diff);
      expect(result).toBeDefined();
      expect(result.ops).toBeDefined();
      expect(result.ops.length).toBeGreaterThan(0);
    });

    it('handles empty diff', () => {
      const baseDelta = new Delta([{ insert: 'Hello' }]);
      const emptyDiff = new Delta();
      
      const result = applyDiff(baseDelta, emptyDiff);
      expect(result).toBeDefined();
      expect(result.ops).toEqual(baseDelta.ops);
    });
  });

  describe('computeDiff', () => {
    it('computes diff between two deltas', () => {
      const oldDelta = new Delta([{ insert: 'Hello' }]);
      const newDelta = new Delta([{ insert: 'Hello World' }]);
      
      const diffResult = computeDiff(oldDelta, newDelta);
      expect(diffResult).toBeDefined();
      expect(diffResult.insertions).toBeDefined();
      expect(diffResult.deletions).toBeDefined();
      expect(diffResult.blockChanges).toBeDefined();
    });

    it('handles identical deltas', () => {
      const delta = new Delta([{ insert: 'Hello' }]);
      const diffResult = computeDiff(delta, delta);
      expect(diffResult.insertions).toHaveLength(0);
      expect(diffResult.deletions).toHaveLength(0);
    });
  });

  describe('createUnifiedDiff', () => {
    it('creates a unified diff', () => {
      const oldDelta = new Delta([{ insert: 'Hello' }]);
      const newDelta = new Delta([{ insert: 'Hello World' }]);
      
      const unifiedDiff = createUnifiedDiff(oldDelta, newDelta);
      expect(unifiedDiff).toBeDefined();
      expect(unifiedDiff.ops).toBeDefined();
    });
  });
}); 