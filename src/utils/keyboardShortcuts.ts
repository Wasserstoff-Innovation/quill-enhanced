import Quill from 'quill';

const Delta = Quill.import('delta');
type DeltaStatic = typeof Delta;

export interface Shortcut {
  key: string;
  ctrlKey?: boolean;
  shiftKey?: boolean;
  altKey?: boolean;
  action: (quill: any) => void;
}

export class KeyboardShortcutsManager {
  private quill: any;
  private shortcuts: Map<string, Shortcut>;

  constructor(quill: any) {
    this.quill = quill;
    this.shortcuts = new Map();
    this.initializeDefaultShortcuts();
    this.attachEventListeners();
  }

  private initializeDefaultShortcuts(): void {
    // Text formatting shortcuts
    this.addShortcut({
      key: 'b',
      ctrlKey: true,
      action: (quill) => {
        const range = quill.getSelection();
        if (range) {
          quill.format('bold', !quill.getFormat(range).bold);
        }
      }
    });

    this.addShortcut({
      key: 'i',
      ctrlKey: true,
      action: (quill) => {
        const range = quill.getSelection();
        if (range) {
          quill.format('italic', !quill.getFormat(range).italic);
        }
      }
    });

    this.addShortcut({
      key: 'u',
      ctrlKey: true,
      action: (quill) => {
        const range = quill.getSelection();
        if (range) {
          quill.format('underline', !quill.getFormat(range).underline);
        }
      }
    });

    // Heading shortcuts
    this.addShortcut({
      key: '1',
      ctrlKey: true,
      action: (quill) => {
        const range = quill.getSelection();
        if (range) {
          quill.format('header', 1);
        }
      }
    });

    this.addShortcut({
      key: '2',
      ctrlKey: true,
      action: (quill) => {
        const range = quill.getSelection();
        if (range) {
          quill.format('header', 2);
        }
      }
    });

    // List shortcuts
    this.addShortcut({
      key: 'l',
      ctrlKey: true,
      action: (quill) => {
        const range = quill.getSelection();
        if (range) {
          quill.format('list', 'bullet');
        }
      }
    });

    this.addShortcut({
      key: 'o',
      ctrlKey: true,
      action: (quill) => {
        const range = quill.getSelection();
        if (range) {
          quill.format('list', 'ordered');
        }
      }
    });

    // Undo/Redo shortcuts
    this.addShortcut({
      key: 'z',
      ctrlKey: true,
      action: (quill) => {
        quill.history.undo();
      }
    });

    this.addShortcut({
      key: 'z',
      ctrlKey: true,
      shiftKey: true,
      action: (quill) => {
        quill.history.redo();
      }
    });

    // Save shortcut
    this.addShortcut({
      key: 's',
      ctrlKey: true,
      action: (quill) => {
        // Trigger save event
        quill.emit('save');
      }
    });
  }

  private attachEventListeners(): void {
    this.quill.root.addEventListener('keydown', (e: KeyboardEvent) => {
      const shortcut = this.getShortcut(e);
      if (shortcut) {
        e.preventDefault();
        shortcut.action(this.quill);
      }
    });
  }

  private getShortcut(e: KeyboardEvent): Shortcut | undefined {
    const key = e.key.toLowerCase();
    return this.shortcuts.get(this.getShortcutKey(key, e.ctrlKey, e.shiftKey, e.altKey));
  }

  private getShortcutKey(key: string, ctrlKey?: boolean, shiftKey?: boolean, altKey?: boolean): string {
    return `${ctrlKey ? 'ctrl+' : ''}${shiftKey ? 'shift+' : ''}${altKey ? 'alt+' : ''}${key}`;
  }

  public addShortcut(shortcut: Shortcut): void {
    const shortcutKey = this.getShortcutKey(
      shortcut.key,
      shortcut.ctrlKey,
      shortcut.shiftKey,
      shortcut.altKey
    );
    this.shortcuts.set(shortcutKey, shortcut);
  }

  public removeShortcut(key: string, ctrlKey?: boolean, shiftKey?: boolean, altKey?: boolean): void {
    const shortcutKey = this.getShortcutKey(key, ctrlKey, shiftKey, altKey);
    this.shortcuts.delete(shortcutKey);
  }

  public destroy(): void {
    this.shortcuts.clear();
  }
} 