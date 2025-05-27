import { jest } from '@jest/globals';
import { AutosavePlugin } from '../Autosave';

// Mock Delta class with equals method
class MockDelta {
  ops: any[];
  
  constructor(ops: any[] = []) {
    this.ops = ops;
  }
  
  equals(other: MockDelta): boolean {
    return JSON.stringify(this.ops) === JSON.stringify(other.ops);
  }
}

// Mock Quill
class MockQuill {
  private eventHandlers: Record<string, Function[]> = {};
  private content = new MockDelta([{ insert: 'initial content' }]);
  public on = jest.fn((event: string, handler: Function) => {
    if (!this.eventHandlers[event]) {
      this.eventHandlers[event] = [];
    }
    this.eventHandlers[event].push(handler);
  });

  off(event: string, handler: Function) {
    if (this.eventHandlers[event]) {
      this.eventHandlers[event] = this.eventHandlers[event].filter(h => h !== handler);
    }
  }

  getContents() {
    return this.content;
  }

  // Method to trigger events for testing
  triggerEvent(event: string, ...args: any[]) {
    if (this.eventHandlers[event]) {
      this.eventHandlers[event].forEach(handler => handler(...args));
    }
  }

  // Method to simulate content change
  changeContent(newContent: any) {
    const oldContent = this.content;
    this.content = new MockDelta(newContent.ops);
    this.triggerEvent('text-change', new MockDelta(), oldContent, 'user');
  }
}

jest.mock('quill', () => {
  const Delta = class {
    ops: any[];
    constructor(ops: any[] = []) {
      this.ops = ops;
    }
  };

  return {
    default: MockQuill,
    Delta
  };
});

// Mock storageManager
jest.mock('../../utils/storageUtils', () => ({
  storageManager: {
    saveDraft: jest.fn().mockImplementation(() => Promise.resolve('draft_123')),
    getLatestDraft: jest.fn().mockImplementation(() => Promise.resolve(null)),
    clearDrafts: jest.fn().mockImplementation(() => Promise.resolve(undefined)),
    getDrafts: jest.fn().mockImplementation(() => Promise.resolve([])),
    getStorageStats: jest.fn().mockImplementation(() => Promise.resolve({})),
    checkVersionConflict: jest.fn().mockImplementation(() => Promise.resolve({ hasConflict: false, conflictingDrafts: [] }))
  }
}));

describe('Autosave Plugin', () => {
  let quill: MockQuill;
  let mockOnSave: jest.Mock;
  let mockOnError: jest.Mock;

  beforeEach(() => {
    jest.useFakeTimers();
    quill = new MockQuill();
    mockOnSave = jest.fn();
    mockOnError = jest.fn();
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.clearAllMocks();
  });

  describe('autosave functionality', () => {
    it('saves content when save method is called directly', async () => {
      const autosave = new AutosavePlugin(quill, {
        interval: 999999, // Very long interval to avoid infinite loop
        debounceDelay: 500,
        onSave: mockOnSave,
        onError: mockOnError
      });

      // Change content first
      quill.changeContent({ ops: [{ insert: 'new content' }] });

      // Call save directly
      await autosave.save();

      expect(mockOnSave).toHaveBeenCalled();
    });

    it('sets up event listeners on initialization', () => {
      const autosave = new AutosavePlugin(quill, {
        interval: 999999,
        debounceDelay: 100,
        onSave: mockOnSave,
        onError: mockOnError
      });

      // Verify that event listeners were set up
      expect(quill.on).toHaveBeenCalledWith('text-change', expect.any(Function));
      expect(quill.on).toHaveBeenCalledWith('selection-change', expect.any(Function));
    });

    it('only saves when content has changed', async () => {
      const autosave = new AutosavePlugin(quill, {
        interval: 999999,
        debounceDelay: 100,
        onSave: mockOnSave,
        onError: mockOnError
      });

      // First save will always trigger (no lastContent yet)
      await autosave.save();
      expect(mockOnSave).toHaveBeenCalledTimes(1);

      // Save again with same content should not trigger onSave again
      await autosave.save();
      expect(mockOnSave).toHaveBeenCalledTimes(1);

      // Change content and save should trigger onSave
      quill.changeContent({ ops: [{ insert: 'new content' }] });
      await autosave.save();
      expect(mockOnSave).toHaveBeenCalledTimes(2);

      // Save again with same content should not trigger onSave again
      await autosave.save();
      expect(mockOnSave).toHaveBeenCalledTimes(2);
    });
  });

  describe('error handling', () => {
    it('calls onError when save fails', async () => {
      const failingOnSave = jest.fn().mockImplementation(() => {
        throw new Error('Save failed');
      });

      const autosave = new AutosavePlugin(quill, {
        interval: 999999,
        debounceDelay: 100,
        onSave: failingOnSave,
        onError: mockOnError
      });

      // Change content and save directly
      quill.changeContent({ ops: [{ insert: 'content' }] });
      await autosave.save();

      expect(mockOnError).toHaveBeenCalled();
      expect(mockOnError.mock.calls[0][0]).toBeInstanceOf(Error);
    });

    it('continues saving after error', async () => {
      let callCount = 0;
      const conditionalOnSave = jest.fn().mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          throw new Error('Save failed');
        }
        return Promise.resolve();
      });

      const mockOnError = jest.fn();
      const plugin = new AutosavePlugin(quill, {
        interval: 999999,
        debounceDelay: 100,
        onSave: conditionalOnSave,
        onError: mockOnError
      });

      // First save should fail
      quill.changeContent({ ops: [{ insert: 'content' }] });
      await plugin.save();
      expect(conditionalOnSave).toHaveBeenCalledTimes(1);
      expect(mockOnError).toHaveBeenCalledTimes(1);

      // Second save should succeed
      quill.changeContent({ ops: [{ insert: 'content 2' }] });
      await plugin.save();
      expect(conditionalOnSave).toHaveBeenCalledTimes(2);
      expect(mockOnError).toHaveBeenCalledTimes(1); // No additional error
    });
  });
}); 