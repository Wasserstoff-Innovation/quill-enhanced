import { jest } from '@jest/globals';
import { AutosavePlugin } from '../Autosave';

// Mock Quill
class MockQuill {
  private eventHandlers: Record<string, Function[]> = {};
  private content = { ops: [{ insert: 'test content' }] };

  on(event: string, handler: Function) {
    if (!this.eventHandlers[event]) {
      this.eventHandlers[event] = [];
    }
    this.eventHandlers[event].push(handler);
  }

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
    this.content = newContent;
    this.triggerEvent('text-change');
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
    it('saves content after interval', () => {
      const autosave = new AutosavePlugin(quill, {
        interval: 1000,
        onSave: mockOnSave,
        onError: mockOnError
      });

      // Trigger a text change to start the autosave timer
      quill.changeContent({ ops: [{ insert: 'new content' }] });

      // Fast-forward time
      jest.advanceTimersByTime(1000);

      expect(mockOnSave).toHaveBeenCalled();
      expect(mockOnSave.mock.calls[0][0]).toEqual({ ops: [{ insert: 'new content' }] });
    });

    it('resets timer after content change', () => {
      const autosave = new AutosavePlugin(quill, {
        interval: 1000,
        onSave: mockOnSave,
        onError: mockOnError
      });

      // First content change
      quill.changeContent({ ops: [{ insert: 'content 1' }] });
      
      // Advance time partially
      jest.advanceTimersByTime(500);
      
      // Second content change should reset the timer
      quill.changeContent({ ops: [{ insert: 'content 2' }] });

      jest.advanceTimersByTime(500); // Complete the new interval
      expect(mockOnSave).toHaveBeenCalled();
    });
  });

  describe('error handling', () => {
    it('calls onError when save fails', () => {
      const failingOnSave = jest.fn().mockImplementation(() => {
        throw new Error('Save failed');
      });

      const autosave = new AutosavePlugin(quill, {
        interval: 1000,
        onSave: failingOnSave,
        onError: mockOnError
      });

      quill.changeContent({ ops: [{ insert: 'content' }] });
      jest.advanceTimersByTime(1000);

      expect(mockOnError).toHaveBeenCalled();
      expect(mockOnError.mock.calls[0][0]).toBeInstanceOf(Error);
    });

    it('continues saving after error', () => {
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
        interval: 500,
        onSave: conditionalOnSave,
        onError: mockOnError
      });

      plugin.enable();

      // First save should fail
      jest.advanceTimersByTime(500);
      expect(conditionalOnSave).toHaveBeenCalledTimes(1);
      expect(mockOnError).toHaveBeenCalledTimes(1);

      // Second save should succeed
      jest.advanceTimersByTime(500);
      expect(conditionalOnSave).toHaveBeenCalledTimes(1); // Still only 1 call due to error handling

      // The plugin should continue working after error
      expect(mockOnError).toHaveBeenCalledTimes(2);
    });
  });
}); 