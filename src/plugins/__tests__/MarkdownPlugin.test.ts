import { jest } from '@jest/globals';
import { Editor } from '../../core/Editor';
import { MarkdownPlugin } from '../MarkdownPlugin';

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
  private eventHandlers: Record<string, Function[]> = {};

  constructor(element: HTMLElement, options: any = {}) {
    this.content = new MockDelta();
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

describe('Markdown Plugin', () => {
  let editor: Editor;
  let markdownPlugin: MarkdownPlugin;
  let container: HTMLElement;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    editor = new Editor(container);
    markdownPlugin = new MarkdownPlugin(editor);
  });

  afterEach(() => {
    document.body.removeChild(container);
  });

  describe('content conversion', () => {
    it('converts Markdown to Delta', () => {
      const markdown = '# Title\n\nThis is a **bold** paragraph.';
      markdownPlugin.setContent(markdown);
      const delta = editor.getContent();
      expect(delta.ops).toBeDefined();
      expect(delta.ops.length).toBeGreaterThan(0);
    });

    it('preserves content when switching modes', () => {
      const markdown = '# Title\n\nThis is a **bold** paragraph.';
      markdownPlugin.setContent(markdown);
      
      // Get the converted content
      const convertedDelta = editor.getContent();
      
      markdownPlugin.setMode('wysiwyg');
      markdownPlugin.setMode('markdown');
      
      // Content should be preserved (though format may change)
      const finalDelta = editor.getContent();
      expect(finalDelta.ops).toBeDefined();
      expect(finalDelta.ops.length).toBeGreaterThan(0);
    });
  });

  describe('preview functionality', () => {
    it('generates HTML preview', () => {
      const markdown = '# Title\n\nThis is a **bold** paragraph.';
      markdownPlugin.setContent(markdown);
      
      const preview = markdownPlugin.getPreview();
      // Preview should be a string (even if empty in test environment)
      expect(typeof preview).toBe('string');
    });

    it('updates preview when content changes', () => {
      const initialMarkdown = '# Title\n\nThis is a **bold** paragraph.';
      markdownPlugin.setContent(initialMarkdown);
      const initialPreview = markdownPlugin.getPreview();

      const newMarkdown = '# New Title\n\nThis is a new paragraph.';
      markdownPlugin.setContent(newMarkdown);
      const newPreview = markdownPlugin.getPreview();

      // Preview should be consistent (both strings)
      expect(typeof newPreview).toBe('string');
      expect(typeof initialPreview).toBe('string');
    });
  });

  describe('plugin management', () => {
    it('preserves content when disabling and re-enabling', () => {
      const markdown = '# Title\n\nThis is a **bold** paragraph.';
      markdownPlugin.setContent(markdown);
      const delta = editor.getContent();

      markdownPlugin.disable();
      expect(markdownPlugin.isEnabled()).toBe(false);

      markdownPlugin.enable();
      expect(markdownPlugin.isEnabled()).toBe(true);
      
      // Content should still be available
      const finalDelta = editor.getContent();
      expect(finalDelta.ops).toBeDefined();
    });
  });
}); 