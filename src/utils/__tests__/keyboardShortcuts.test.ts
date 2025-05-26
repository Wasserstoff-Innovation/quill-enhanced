import { jest } from '@jest/globals';
import { KeyboardShortcutsManager } from '../keyboardShortcuts';
import type { Shortcut } from '../keyboardShortcuts';
import Quill from 'quill';

describe('KeyboardShortcutsManager', () => {
  let quill: any;
  let manager: KeyboardShortcutsManager;

  beforeEach(() => {
    // Create a mock Quill instance
    quill = {
      getSelection: jest.fn(),
      getFormat: jest.fn(),
      format: jest.fn(),
      history: {
        undo: jest.fn(),
        redo: jest.fn()
      },
      emit: jest.fn(),
      root: document.createElement('div')
    };
    manager = new KeyboardShortcutsManager(quill);
  });

  describe('Text Formatting Shortcuts', () => {
    it('should toggle bold formatting', () => {
      const range = { index: 0, length: 5 };
      quill.getSelection.mockReturnValue(range);
      quill.getFormat.mockReturnValue({ bold: false });

      const event = new KeyboardEvent('keydown', {
        key: 'b',
        ctrlKey: true
      });
      quill.root.dispatchEvent(event);

      expect(quill.format).toHaveBeenCalledWith('bold', true);
    });

    it('should toggle italic formatting', () => {
      const range = { index: 0, length: 5 };
      quill.getSelection.mockReturnValue(range);
      quill.getFormat.mockReturnValue({ italic: false });

      const event = new KeyboardEvent('keydown', {
        key: 'i',
        ctrlKey: true
      });
      quill.root.dispatchEvent(event);

      expect(quill.format).toHaveBeenCalledWith('italic', true);
    });

    it('should toggle underline formatting', () => {
      const range = { index: 0, length: 5 };
      quill.getSelection.mockReturnValue(range);
      quill.getFormat.mockReturnValue({ underline: false });

      const event = new KeyboardEvent('keydown', {
        key: 'u',
        ctrlKey: true
      });
      quill.root.dispatchEvent(event);

      expect(quill.format).toHaveBeenCalledWith('underline', true);
    });
  });

  describe('Heading Shortcuts', () => {
    it('should apply heading 1', () => {
      const range = { index: 0, length: 5 };
      quill.getSelection.mockReturnValue(range);

      const event = new KeyboardEvent('keydown', {
        key: '1',
        ctrlKey: true
      });
      quill.root.dispatchEvent(event);

      expect(quill.format).toHaveBeenCalledWith('header', 1);
    });

    it('should apply heading 2', () => {
      const range = { index: 0, length: 5 };
      quill.getSelection.mockReturnValue(range);

      const event = new KeyboardEvent('keydown', {
        key: '2',
        ctrlKey: true
      });
      quill.root.dispatchEvent(event);

      expect(quill.format).toHaveBeenCalledWith('header', 2);
    });
  });

  describe('List Shortcuts', () => {
    it('should apply bullet list', () => {
      const range = { index: 0, length: 5 };
      quill.getSelection.mockReturnValue(range);

      const event = new KeyboardEvent('keydown', {
        key: 'l',
        ctrlKey: true
      });
      quill.root.dispatchEvent(event);

      expect(quill.format).toHaveBeenCalledWith('list', 'bullet');
    });

    it('should apply ordered list', () => {
      const range = { index: 0, length: 5 };
      quill.getSelection.mockReturnValue(range);

      const event = new KeyboardEvent('keydown', {
        key: 'o',
        ctrlKey: true
      });
      quill.root.dispatchEvent(event);

      expect(quill.format).toHaveBeenCalledWith('list', 'ordered');
    });
  });

  describe('Undo/Redo Shortcuts', () => {
    it('should undo changes', () => {
      const event = new KeyboardEvent('keydown', {
        key: 'z',
        ctrlKey: true
      });
      quill.root.dispatchEvent(event);

      expect(quill.history.undo).toHaveBeenCalled();
    });

    it('should redo changes', () => {
      const event = new KeyboardEvent('keydown', {
        key: 'z',
        ctrlKey: true,
        shiftKey: true
      });
      quill.root.dispatchEvent(event);

      expect(quill.history.redo).toHaveBeenCalled();
    });
  });

  describe('Save Shortcut', () => {
    it('should trigger save event', () => {
      const event = new KeyboardEvent('keydown', {
        key: 's',
        ctrlKey: true
      });
      quill.root.dispatchEvent(event);

      expect(quill.emit).toHaveBeenCalledWith('save');
    });
  });

  describe('Custom Shortcuts', () => {
    it('should add custom shortcut', () => {
      const customAction = jest.fn();
      const shortcut: Shortcut = {
        key: 'x',
        ctrlKey: true,
        action: customAction
      };

      manager.addShortcut(shortcut);

      const event = new KeyboardEvent('keydown', {
        key: 'x',
        ctrlKey: true
      });
      quill.root.dispatchEvent(event);

      expect(customAction).toHaveBeenCalledWith(quill);
    });

    it('should remove custom shortcut', () => {
      const customAction = jest.fn();
      const shortcut: Shortcut = {
        key: 'x',
        ctrlKey: true,
        action: customAction
      };

      manager.addShortcut(shortcut);
      manager.removeShortcut('x', true);

      const event = new KeyboardEvent('keydown', {
        key: 'x',
        ctrlKey: true
      });
      quill.root.dispatchEvent(event);

      expect(customAction).not.toHaveBeenCalled();
    });
  });

  describe('Cleanup', () => {
    it('should clear shortcuts on destroy', () => {
      const customAction = jest.fn();
      const shortcut: Shortcut = {
        key: 'x',
        ctrlKey: true,
        action: customAction
      };

      manager.addShortcut(shortcut);
      manager.destroy();

      const event = new KeyboardEvent('keydown', {
        key: 'x',
        ctrlKey: true
      });
      quill.root.dispatchEvent(event);

      expect(customAction).not.toHaveBeenCalled();
    });
  });
}); 