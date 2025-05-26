import type { EditorState, Delta } from './types';

export class StateManager {
  private state: EditorState;
  private listeners: Set<(state: EditorState) => void> = new Set();

  constructor(initialState: Partial<EditorState> = {}) {
    this.state = {
      content: initialState.content || null,
      selection: initialState.selection || null,
      formats: initialState.formats || {},
      mode: initialState.mode || 'wysiwyg',
      readOnly: initialState.readOnly || false,
      isFocused: initialState.isFocused || false
    };
  }

  getState(): EditorState {
    return { ...this.state };
  }

  setState(partial: Partial<EditorState>): void {
    this.state = {
      ...this.state,
      ...partial
    };
    this.notifyListeners();
  }

  updateContent(content: Delta): void {
    this.setState({ content });
  }

  updateSelection(selection: { index: number; length: number } | null): void {
    this.setState({ selection });
  }

  updateFormats(formats: Record<string, any>): void {
    this.setState({ formats });
  }

  setMode(mode: 'wysiwyg' | 'markdown'): void {
    this.setState({ mode });
  }

  setReadOnly(readOnly: boolean): void {
    this.setState({ readOnly });
  }

  setFocused(isFocused: boolean): void {
    this.setState({ isFocused });
  }

  subscribe(listener: (state: EditorState) => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notifyListeners(): void {
    const state = this.getState();
    this.listeners.forEach(listener => listener(state));
  }
} 