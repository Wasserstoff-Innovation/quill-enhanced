import type { Editor, Plugin } from '../core/types';
import { toMarkdown, fromMarkdown } from '../utils/markdownUtils';
import type { Delta } from '../core/types';

export class MarkdownPlugin implements Plugin {
  private editor: Editor;
  private mode: 'wysiwyg' | 'markdown' = 'wysiwyg';
  private enabled = true;

  constructor(editor: Editor) {
    this.editor = editor;
  }

  getName(): string {
    return 'markdown';
  }

  init(): void {
    // No initialization needed
  }

  destroy(): void {
    // No cleanup needed
  }

  setContent(content: string): void {
    if (this.mode === 'markdown') {
      const delta = fromMarkdown(content);
      this.editor.setContent(delta);
    } else {
      this.editor.setText(content);
    }
  }

  getContent(): string {
    const delta = this.editor.getContent();
    return toMarkdown(delta);
  }

  setMode(mode: 'wysiwyg' | 'markdown'): void {
    if (mode === this.mode) return;

    const content = this.getContent();
    this.mode = mode;

    if (mode === 'markdown') {
      const delta = fromMarkdown(content);
      this.editor.setContent(delta);
    } else {
      this.editor.setText(content);
    }
  }

  getMode(): 'wysiwyg' | 'markdown' {
    return this.mode;
  }

  getPreview(): string {
    const content = this.getContent();
    return toMarkdown(content);
  }

  enable(): void {
    this.enabled = true;
  }

  disable(): void {
    this.enabled = false;
  }

  isEnabled(): boolean {
    return this.enabled;
  }
} 