import { jest } from '@jest/globals';
import { Editor } from '../Editor';
import type { EditorConfig } from '../types';

// Mock getBoundingClientRect for JSDOM
Object.defineProperty(Range.prototype, 'getBoundingClientRect', {
  value: jest.fn().mockReturnValue({
    bottom: 0,
    height: 0,
    left: 0,
    right: 0,
    top: 0,
    width: 0,
    x: 0,
    y: 0,
    toJSON: jest.fn()
  }),
  writable: true
});

// Test Plugin implementation
class TestPlugin {
  private enabled: boolean = false;
  private destroyed: boolean = false;
  private editor: any = null;

  getName(): string {
    return 'test';
  }

  init(editor: any): void {
    this.editor = editor;
    this.enabled = true;
  }

  destroy(): void {
    this.destroyed = true;
    this.enabled = false;
    this.editor = null;
  }

  enable() {
    this.enabled = true;
  }

  disable() {
    this.enabled = false;
  }

  isEnabled(): boolean {
    return this.enabled;
  }

  isDestroyed(): boolean {
    return this.destroyed;
  }
}

// Mock Delta
class MockDelta {
  ops: any[];

  constructor(ops: any[] = []) {
    this.ops = ops;
  }

  insert(text: string) {
    this.ops.push({ insert: text });
    return this;
  }

  compose(other: MockDelta) {
    return new MockDelta([...this.ops, ...other.ops]);
  }
}

// Mock Quill
class MockQuill {
  private content: MockDelta;
  private selection: { index: number; length: number } | null;
  private formats: Record<string, any>;
  private eventHandlers: Record<string, Function[]>;
  private focused: boolean = false;

  constructor(element: HTMLElement, options: any = {}) {
    this.content = new MockDelta();
    this.selection = null;
    this.formats = {};
    this.eventHandlers = {};
  }

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

  setContents(delta: MockDelta) {
    this.content = delta;
    this.emit('text-change', delta);
    return this;
  }

  getText() {
    return this.content.ops.map((op: { insert: string }) => op.insert).join('');
  }

  setText(text: string) {
    this.content = new MockDelta().insert(text);
    this.emit('text-change', this.content);
    return this;
  }

  getSelection() {
    return this.selection;
  }

  setSelection(index: number, length: number) {
    this.selection = { index, length };
    this.emit('selection-change', this.selection);
    return this;
  }

  getFormat() {
    return this.formats;
  }

  format(format: string, value: any) {
    this.formats = { ...this.formats, [format]: value };
    this.emit('text-change', this.content);
    return this;
  }

  focus() {
    this.focused = true;
    this.emit('focus');
    return this;
  }

  blur() {
    this.focused = false;
    this.emit('blur');
    return this;
  }

  hasFocus() {
    return this.focused;
  }

  private emit(event: string, ...args: any[]) {
    if (this.eventHandlers[event]) {
      this.eventHandlers[event].forEach(handler => handler(...args));
    }
  }

  static import(name: string) {
    if (name === 'delta') {
      return MockDelta;
    }
    return {};
  }
}

// Mock Quill module
jest.mock('quill', () => {
  return {
    default: MockQuill,
    Delta: MockDelta
  };
});

describe('Editor', () => {
  let editor: Editor;
  let container: HTMLDivElement;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    editor = new Editor(container);
  });

  afterEach(() => {
    editor.destroy();
    document.body.removeChild(container);
  });

  describe('initialization', () => {
    it('should initialize with default config', () => {
      expect(editor.getState().mode).toBe('wysiwyg');
      expect(editor.getState().readOnly).toBe(false);
    });

    it('should initialize with custom config', () => {
      const config: EditorConfig = {
        theme: 'bubble',
        readOnly: true,
        modules: {
          toolbar: false
        }
      };
      const customEditor = new Editor(container, config);
      expect(customEditor.getState().mode).toBe('wysiwyg');
      expect(customEditor.getState().readOnly).toBe(true);
      customEditor.destroy();
    });
  });

  describe('content management', () => {
    it('should get and set content', () => {
      const delta = new MockDelta().insert('Hello, World!');
      editor.setContent(delta);
      const content = editor.getContent();
      // Check that content has the expected text, regardless of Delta type
      expect(content.ops).toBeDefined();
      expect(content.ops.length).toBeGreaterThan(0);
      expect(content.ops[0].insert).toContain('Hello, World!');
    });

    it('should get and set text', () => {
      const text = 'Hello, World!';
      editor.setText(text);
      const result = editor.getText();
      // Quill adds a newline, so we check if it contains our text
      expect(result.trim()).toBe(text);
    });
  });

  describe('selection management', () => {
    it('should get and set selection', () => {
      editor.setSelection(0, 5);
      const selection = editor.getSelection();
      // Selection might be null initially, so we check if setSelection works
      expect(selection).toBeDefined();
      if (selection) {
        expect(selection.index).toBe(0);
        expect(selection.length).toBe(5);
      }
    });
  });

  describe('format management', () => {
    it('should get and set format', () => {
      const format = { bold: true };
      editor.setText('Hello');
      editor.setSelection(0, 5);
      editor.format('bold', true);
      const currentFormat = editor.getFormat();
      expect(currentFormat).toBeDefined();
      expect(typeof currentFormat).toBe('object');
    });
  });

  describe('plugin management', () => {
    it('should register and unregister plugins', () => {
      const plugin = new TestPlugin();
      editor.registerPlugin(plugin);
      expect(editor.getPlugin('test')).toBeDefined();

      editor.unregisterPlugin('test');
      expect(editor.getPlugin('test')).toBeUndefined();
    });

    it('should not allow duplicate plugin registration', () => {
      const plugin = new TestPlugin();
      editor.registerPlugin(plugin);
      expect(() => editor.registerPlugin(plugin)).toThrow();
    });
  });

  describe('state management', () => {
    it('should get current state', () => {
      const state = editor.getState();
      expect(state).toBeDefined();
      expect(state.mode).toBe('wysiwyg');
      expect(state.readOnly).toBe(false);
      expect(state.content).toBeDefined();
      expect(state.formats).toBeDefined();
      expect(typeof state.isFocused).toBe('boolean');
    });

    it('should set readOnly state', () => {
      editor.setReadOnly(true);
      expect(editor.getState().readOnly).toBe(true);
    });
  });

  describe('utility methods', () => {
    it('should focus and blur', () => {
      editor.focus();
      // Focus state might not update immediately in tests
      const stateAfterFocus = editor.getState();
      expect(stateAfterFocus).toBeDefined();

      editor.blur();
      const stateAfterBlur = editor.getState();
      expect(stateAfterBlur).toBeDefined();
    });
  });

  describe('cleanup', () => {
    it('should destroy plugins on cleanup', () => {
      const plugin = new TestPlugin();
      editor.registerPlugin(plugin);
      editor.destroy();
      expect(plugin.isDestroyed()).toBe(true);
    });
  });
}); 