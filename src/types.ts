import Delta from 'quill';

export interface EditorConfig {
  mode?: 'wysiwyg' | 'markdown';
  readOnly?: boolean;
  theme?: string;
  modules?: Record<string, any>;
}

export interface Plugin {
  getName(): string;
  init(editor: any): void;
  destroy(): void;
  enable(): void;
  disable(): void;
  isEnabled(): boolean;
  isDestroyed?(): boolean;
}

export interface EditorState {
  mode: 'wysiwyg' | 'markdown';
  readOnly: boolean;
  plugins: Plugin[];
  content: Delta;
  formats: Record<string, any>;
  selection: { index: number; length: number } | null;
  isFocused: boolean;
} 