import Quill from 'quill';
import type { Delta, EditorConfig, EditorState, Plugin, EditorChangeEvent, Editor as EditorType } from './types';
import { PluginManager } from './PluginManager';
import { StateManager } from './StateManager';

export class Editor implements EditorType {
  private quill: Quill;
  private pluginManager: PluginManager;
  private stateManager: StateManager;

  constructor(element: HTMLElement, config: EditorConfig = {}) {
    this.quill = new Quill(element, {
      theme: config.theme || 'snow',
      modules: config.modules || {},
      formats: config.formats,
      placeholder: config.placeholder,
      readOnly: config.readOnly,
      bounds: config.bounds,
      scrollingContainer: config.scrollingContainer
    });

    this.stateManager = new StateManager({
      content: this.quill.getContents(),
      selection: this.quill.getSelection(),
      formats: this.quill.getFormat(),
      mode: 'wysiwyg',
      readOnly: config.readOnly || false,
      isFocused: false
    });

    this.pluginManager = new PluginManager(this);
    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    this.quill.on('text-change', () => {
      this.stateManager.updateContent(this.quill.getContents());
      this.stateManager.updateFormats(this.quill.getFormat());
    });

    this.quill.on('selection-change', (range) => {
      this.stateManager.updateSelection(range);
    });

    this.quill.on('editor-change', (eventName: EditorChangeEvent['eventName'], ..._args: unknown[]) => {
      if (eventName === 'focus') {
        this.stateManager.setFocused(true);
      } else if (eventName === 'blur') {
        this.stateManager.setFocused(false);
      }
    });
  }

  // Content methods
  getContent(): Delta {
    return this.stateManager.getState().content;
  }

  setContent(content: Delta): void {
    this.quill.setContents(content);
  }

  getText(): string {
    return this.quill.getText();
  }

  setText(text: string): void {
    this.quill.setText(text);
  }

  // Selection methods
  getSelection(): { index: number; length: number } | null {
    return this.stateManager.getState().selection;
  }

  setSelection(index: number, length = 0): void {
    this.quill.setSelection(index, length);
  }

  // Format methods
  getFormat(): Record<string, unknown> {
    return this.stateManager.getState().formats;
  }

  format(format: string, value: unknown): void {
    this.quill.format(format, value);
  }

  // Plugin methods
  registerPlugin(plugin: Plugin): void {
    this.pluginManager.register(plugin);
  }

  unregisterPlugin(name: string): void {
    this.pluginManager.unregister(name);
  }

  getPlugin(name: string): Plugin | undefined {
    return this.pluginManager.getPlugin(name);
  }

  // State methods
  getState(): EditorState {
    return this.stateManager.getState();
  }

  setReadOnly(readOnly: boolean): void {
    this.stateManager.setReadOnly(readOnly);
    this.quill.enable(!readOnly);
  }

  // Utility methods
  focus(): void {
    this.quill.focus();
  }

  blur(): void {
    this.quill.blur();
  }

  destroy(): void {
    this.pluginManager.destroy();
    // Additional cleanup if needed
  }
} 