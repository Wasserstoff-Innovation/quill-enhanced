import Quill from 'quill';

const Delta = Quill.import('delta');
type DeltaType = InstanceType<typeof Delta>;

export interface SelectionRange {
  index: number;
  length: number;
}

export interface FormatOptions {
  [key: string]: any;
}

export interface HighlightOptions {
  className?: string;
  backgroundColor?: string;
  color?: string;
  title?: string;
  id?: string;
}

export interface CustomAction {
  id: string;
  label: string;
  icon?: string;
  shortcut?: string;
  handler: (editor: any, selection: SelectionRange) => void;
  isEnabled?: (editor: any, selection: SelectionRange) => boolean;
  isVisible?: (editor: any, selection: SelectionRange) => boolean;
}

export class SelectionAPI {
  private quill: any;
  private customActions: Map<string, CustomAction> = new Map();
  private highlights: Map<string, SelectionRange & HighlightOptions> = new Map();

  constructor(quill: any) {
    this.quill = quill;
  }

  /**
   * Get current selection range
   */
  getSelection(): SelectionRange | null {
    const selection = this.quill.getSelection();
    return selection ? { index: selection.index, length: selection.length } : null;
  }

  /**
   * Set selection range
   */
  setSelection(range: SelectionRange): void {
    this.quill.setSelection(range.index, range.length);
  }

  /**
   * Get selected text
   */
  getSelectedText(): string {
    const selection = this.getSelection();
    if (!selection || selection.length === 0) return '';
    
    return this.quill.getText(selection.index, selection.length);
  }

  /**
   * Get selected content as Delta
   */
  getSelectedContent(): DeltaType | null {
    const selection = this.getSelection();
    if (!selection || selection.length === 0) return null;
    
    const fullContent = this.quill.getContents();
    return fullContent.slice(selection.index, selection.index + selection.length);
  }

  /**
   * Replace selected text
   */
  replaceSelectedText(text: string, formats?: FormatOptions): void {
    const selection = this.getSelection();
    if (!selection) return;

    if (selection.length > 0) {
      this.quill.deleteText(selection.index, selection.length);
    }
    
    this.quill.insertText(selection.index, text, formats || {});
    this.quill.setSelection(selection.index + text.length, 0);
  }

  /**
   * Replace selected content with Delta
   */
  replaceSelectedContent(delta: DeltaType): void {
    const selection = this.getSelection();
    if (!selection) return;

    if (selection.length > 0) {
      this.quill.deleteText(selection.index, selection.length);
    }
    
    this.quill.updateContents(
      new Delta()
        .retain(selection.index)
        .concat(delta)
    );
  }

  /**
   * Format selected text
   */
  formatSelection(formats: FormatOptions): void {
    const selection = this.getSelection();
    if (!selection || selection.length === 0) return;

    Object.entries(formats).forEach(([format, value]) => {
      this.quill.formatText(selection.index, selection.length, format, value);
    });
  }

  /**
   * Get formats at current selection
   */
  getSelectionFormats(): FormatOptions {
    const selection = this.getSelection();
    if (!selection) return {};

    if (selection.length === 0) {
      return this.quill.getFormat(selection.index);
    } else {
      return this.quill.getFormat(selection.index, selection.length);
    }
  }

  /**
   * Expand selection to word boundaries
   */
  expandSelectionToWord(): SelectionRange | null {
    const selection = this.getSelection();
    if (!selection) return null;

    const text = this.quill.getText();
    let start = selection.index;
    let end = selection.index + selection.length;

    // Expand start to word boundary
    while (start > 0 && /\w/.test(text[start - 1])) {
      start--;
    }

    // Expand end to word boundary
    while (end < text.length && /\w/.test(text[end])) {
      end++;
    }

    const newRange = { index: start, length: end - start };
    this.setSelection(newRange);
    return newRange;
  }

  /**
   * Expand selection to line boundaries
   */
  expandSelectionToLine(): SelectionRange | null {
    const selection = this.getSelection();
    if (!selection) return null;

    const text = this.quill.getText();
    let start = selection.index;
    let end = selection.index + selection.length;

    // Expand start to line boundary
    while (start > 0 && text[start - 1] !== '\n') {
      start--;
    }

    // Expand end to line boundary
    while (end < text.length && text[end] !== '\n') {
      end++;
    }

    const newRange = { index: start, length: end - start };
    this.setSelection(newRange);
    return newRange;
  }

  /**
   * Highlight a range of text
   */
  highlightRange(range: SelectionRange, options: HighlightOptions = {}): string {
    const highlightId = options.id || `highlight_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const highlightFormat: any = {};
    
    if (options.backgroundColor) {
      highlightFormat.background = options.backgroundColor;
    }
    if (options.color) {
      highlightFormat.color = options.color;
    }
    if (options.className) {
      highlightFormat['highlight-class'] = options.className;
    }
    if (options.title) {
      highlightFormat['highlight-title'] = options.title;
    }
    
    // Apply highlight format
    this.quill.formatText(range.index, range.length, highlightFormat);
    
    // Store highlight info
    this.highlights.set(highlightId, { ...range, ...options });
    
    return highlightId;
  }

  /**
   * Remove highlight
   */
  removeHighlight(highlightId: string): void {
    const highlight = this.highlights.get(highlightId);
    if (!highlight) return;

    // Remove highlight formats
    const removeFormats: any = {};
    if (highlight.backgroundColor) removeFormats.background = false;
    if (highlight.color) removeFormats.color = false;
    if (highlight.className) removeFormats['highlight-class'] = false;
    if (highlight.title) removeFormats['highlight-title'] = false;

    this.quill.formatText(highlight.index, highlight.length, removeFormats);
    this.highlights.delete(highlightId);
  }

  /**
   * Get all highlights
   */
  getHighlights(): Array<{ id: string } & SelectionRange & HighlightOptions> {
    return Array.from(this.highlights.entries()).map(([id, highlight]) => ({
      id,
      ...highlight
    }));
  }

  /**
   * Clear all highlights
   */
  clearHighlights(): void {
    this.highlights.forEach((_, id) => this.removeHighlight(id));
  }

  /**
   * Register a custom action
   */
  registerAction(action: CustomAction): void {
    this.customActions.set(action.id, action);
  }

  /**
   * Unregister a custom action
   */
  unregisterAction(actionId: string): void {
    this.customActions.delete(actionId);
  }

  /**
   * Execute a custom action
   */
  executeAction(actionId: string): void {
    const action = this.customActions.get(actionId);
    if (!action) return;

    const selection = this.getSelection();
    if (!selection) return;

    if (action.isEnabled && !action.isEnabled(this.quill, selection)) {
      return;
    }

    action.handler(this.quill, selection);
  }

  /**
   * Get available actions for current selection
   */
  getAvailableActions(): CustomAction[] {
    const selection = this.getSelection();
    if (!selection) return [];

    return Array.from(this.customActions.values()).filter(action => {
      if (action.isVisible && !action.isVisible(this.quill, selection)) {
        return false;
      }
      if (action.isEnabled && !action.isEnabled(this.quill, selection)) {
        return false;
      }
      return true;
    });
  }

  /**
   * Find text and return ranges
   */
  findText(searchText: string, options: {
    caseSensitive?: boolean;
    wholeWord?: boolean;
    regex?: boolean;
  } = {}): SelectionRange[] {
    const text = this.quill.getText();
    const ranges: SelectionRange[] = [];
    
    let searchPattern: RegExp;
    
    if (options.regex) {
      try {
        searchPattern = new RegExp(searchText, options.caseSensitive ? 'g' : 'gi');
      } catch (e) {
        return ranges; // Invalid regex
      }
    } else {
      const escapedText = searchText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const pattern = options.wholeWord ? `\\b${escapedText}\\b` : escapedText;
      searchPattern = new RegExp(pattern, options.caseSensitive ? 'g' : 'gi');
    }

    let match;
    while ((match = searchPattern.exec(text)) !== null) {
      ranges.push({
        index: match.index,
        length: match[0].length
      });
      
      // Prevent infinite loop on zero-length matches
      if (match[0].length === 0) {
        searchPattern.lastIndex++;
      }
    }

    return ranges;
  }

  /**
   * Replace text in document
   */
  replaceText(searchText: string, replaceText: string, options: {
    caseSensitive?: boolean;
    wholeWord?: boolean;
    regex?: boolean;
    replaceAll?: boolean;
  } = {}): number {
    const ranges = this.findText(searchText, options);
    
    if (ranges.length === 0) return 0;
    
    const rangesToReplace = options.replaceAll ? ranges : [ranges[0]];
    let replacedCount = 0;
    
    // Replace from end to start to maintain correct indices
    for (let i = rangesToReplace.length - 1; i >= 0; i--) {
      const range = rangesToReplace[i];
      this.quill.deleteText(range.index, range.length);
      this.quill.insertText(range.index, replaceText);
      replacedCount++;
    }
    
    return replacedCount;
  }

  /**
   * Apply Delta patch to specific range
   */
  applyDelta(delta: DeltaType, range?: SelectionRange): void {
    if (range) {
      // Apply delta to specific range
      const patchDelta = new Delta()
        .retain(range.index)
        .delete(range.length)
        .concat(delta);
      
      this.quill.updateContents(patchDelta);
    } else {
      // Apply delta to entire document
      this.quill.updateContents(delta);
    }
  }

  /**
   * Get word at position
   */
  getWordAtPosition(index: number): { text: string; range: SelectionRange } | null {
    const text = this.quill.getText();
    
    if (index < 0 || index >= text.length) return null;
    
    let start = index;
    let end = index;
    
    // Find word boundaries
    while (start > 0 && /\w/.test(text[start - 1])) {
      start--;
    }
    
    while (end < text.length && /\w/.test(text[end])) {
      end++;
    }
    
    if (start === end) return null;
    
    return {
      text: text.substring(start, end),
      range: { index: start, length: end - start }
    };
  }

  /**
   * Get line at position
   */
  getLineAtPosition(index: number): { text: string; range: SelectionRange } | null {
    const text = this.quill.getText();
    
    if (index < 0 || index >= text.length) return null;
    
    let start = index;
    let end = index;
    
    // Find line boundaries
    while (start > 0 && text[start - 1] !== '\n') {
      start--;
    }
    
    while (end < text.length && text[end] !== '\n') {
      end++;
    }
    
    return {
      text: text.substring(start, end),
      range: { index: start, length: end - start }
    };
  }

  /**
   * Insert text at position
   */
  insertTextAt(index: number, text: string, formats?: FormatOptions): void {
    this.quill.insertText(index, text, formats || {});
  }

  /**
   * Delete text at range
   */
  deleteTextAt(range: SelectionRange): void {
    this.quill.deleteText(range.index, range.length);
  }

  /**
   * Get text statistics for selection or entire document
   */
  getTextStats(range?: SelectionRange): {
    characters: number;
    charactersNoSpaces: number;
    words: number;
    lines: number;
    paragraphs: number;
  } {
    let text: string;
    
    if (range) {
      text = this.quill.getText(range.index, range.length);
    } else {
      text = this.quill.getText();
    }
    
    const characters = text.length;
    const charactersNoSpaces = text.replace(/\s/g, '').length;
    const words = text.trim() ? text.trim().split(/\s+/).length : 0;
    const lines = text.split('\n').length;
    const paragraphs = text.split(/\n\s*\n/).filter(p => p.trim()).length;
    
    return {
      characters,
      charactersNoSpaces,
      words,
      lines,
      paragraphs
    };
  }

  /**
   * Cleanup and destroy
   */
  destroy(): void {
    this.clearHighlights();
    this.customActions.clear();
  }

  findWordBoundary(index: number, direction: 'start' | 'end'): number {
    const text = this.quill.getText();
    
    if (direction === 'start') {
      // Find start of word
      let i = index;
      while (i > 0 && /\w/.test(text[i - 1])) {
        i--;
      }
      return i;
    } else {
      // Find end of word
      let i = index;
      while (i < text.length && /\w/.test(text[i])) {
        i++;
      }
      return i;
    }
  }
}

// Utility functions for common actions
export const CommonActions = {
  /**
   * Create a highlight action
   */
  createHighlightAction(color: string = '#ffff00'): CustomAction {
    return {
      id: 'highlight',
      label: 'Highlight',
      icon: '🖍️',
      shortcut: 'Ctrl+H',
      handler: (editor: any, selection: SelectionRange) => {
        const selectionAPI = new SelectionAPI(editor);
        selectionAPI.highlightRange(selection, { backgroundColor: color });
      },
      isEnabled: (editor: any, selection: SelectionRange) => selection.length > 0
    };
  },

  /**
   * Create a comment action
   */
  createCommentAction(onComment: (text: string, range: SelectionRange) => void): CustomAction {
    return {
      id: 'comment',
      label: 'Add Comment',
      icon: '💬',
      shortcut: 'Ctrl+M',
      handler: (editor: any, selection: SelectionRange) => {
        const selectionAPI = new SelectionAPI(editor);
        const text = selectionAPI.getSelectedText();
        onComment(text, selection);
      },
      isEnabled: (editor: any, selection: SelectionRange) => selection.length > 0
    };
  },

  /**
   * Create a copy action
   */
  createCopyAction(): CustomAction {
    return {
      id: 'copy',
      label: 'Copy',
      icon: '📋',
      shortcut: 'Ctrl+C',
      handler: (editor: any, selection: SelectionRange) => {
        const selectionAPI = new SelectionAPI(editor);
        const text = selectionAPI.getSelectedText();
        
        if (navigator.clipboard) {
          navigator.clipboard.writeText(text);
        }
      },
      isEnabled: (editor: any, selection: SelectionRange) => selection.length > 0
    };
  },

  /**
   * Create a word count action
   */
  createWordCountAction(onCount: (stats: any) => void): CustomAction {
    return {
      id: 'word-count',
      label: 'Word Count',
      icon: '🔢',
      handler: (editor: any, selection: SelectionRange) => {
        const selectionAPI = new SelectionAPI(editor);
        const stats = selectionAPI.getTextStats(selection.length > 0 ? selection : undefined);
        onCount(stats);
      }
    };
  }
}; 