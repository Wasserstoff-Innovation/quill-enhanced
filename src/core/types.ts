import type Quill from 'quill';

// Core Delta types
export type Delta = ReturnType<typeof Quill.import>['delta'];
export type DeltaOperation = {
  insert?: string | object;
  delete?: number;
  retain?: number;
  attributes?: Record<string, any>;
};

// Core Editor types
export type EditorMode = 'wysiwyg' | 'markdown';
export type EditorTheme = 'snow' | 'bubble';
export type EditorFormat = 'html' | 'markdown' | 'delta';

// Core Plugin types
export interface Plugin {
  getName(): string;
  init(editor: Editor): void;
  destroy(): void;
}

// Core Event types
export type EditorEvent = 
  | 'text-change'
  | 'selection-change'
  | 'editor-change'
  | 'format-change'
  | 'save'
  | 'focus'
  | 'blur';

export type EditorChangeEvent = {
  eventName: 'focus' | 'blur' | 'text-change' | 'selection-change' | 'format-change';
  args: unknown[];
};

// Core Config types
export interface EditorConfig {
  theme?: EditorTheme;
  modules?: Record<string, unknown>;
  formats?: string[];
  placeholder?: string;
  readOnly?: boolean;
  bounds?: string | HTMLElement;
  scrollingContainer?: string | HTMLElement;
}

// Core State types
export interface EditorState {
  content: Delta;
  selection: { index: number; length: number } | null;
  formats: Record<string, unknown>;
  mode: EditorMode;
  readOnly: boolean;
  isFocused: boolean;
}

// Editor class type for plugin initialization
export interface Editor {
  getContent(): Delta;
  setContent(content: Delta): void;
  getText(): string;
  setText(text: string): void;
  getSelection(): { index: number; length: number } | null;
  setSelection(index: number, length?: number): void;
  getFormat(): Record<string, unknown>;
  format(format: string, value: unknown): void;
  getState(): EditorState;
  setReadOnly(readOnly: boolean): void;
  focus(): void;
  blur(): void;
  destroy(): void;
} 