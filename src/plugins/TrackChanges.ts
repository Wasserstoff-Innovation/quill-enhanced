import Quill from 'quill';
import { Change, TrackChangesOptions, TrackChangesPlugin } from './types';
import debounce from 'lodash/debounce';
import { computeDiff, applyDiffHighlighting } from '../utils/diffUtils';

const Delta = Quill.import('delta');
const Inline: any = Quill.import('blots/inline');
const Parchment = Quill.import('parchment');

// InsertBlot for tracked insertions
class InsertBlot extends Inline {
  static blotName = 'insert';
  static tagName = 'span';
  static className = 'insert';
  static scope = Parchment.Scope.INLINE;

  static create(value: any) {
    const node = super.create();
    node.setAttribute('data-track', 'insert');
    node.classList.add('insert');
    return node;
  }
}

// DeleteBlot for tracked deletions
class DeleteBlot extends Inline {
  static blotName = 'delete';
  static tagName = 'span';
  static className = 'delete';
  static scope = Parchment.Scope.INLINE;

  static create(value: any) {
    const node = super.create();
    node.setAttribute('data-track', 'delete');
    node.classList.add('delete');
    return node;
  }
}

Quill.register('formats/insert', InsertBlot);
Quill.register('formats/delete', DeleteBlot);

// Utility: Remove highlight attributes from a Delta
function stripHighlights(delta: any): any {
  const cleanOps = delta.ops.map((op: any) => {
    if (op.attributes) {
      const attrs = { ...op.attributes };
      delete attrs.strike;
      delete attrs.color;
      delete attrs.background;
      return { ...op, attributes: Object.keys(attrs).length ? attrs : undefined };
    }
    return op;
  });
  return new Delta(cleanOps);
}

export class TrackChanges implements TrackChangesPlugin {
  private quill: Quill;
  private changes: Change[] = [];
  private options: TrackChangesOptions;
  private enabled: boolean;
  private lastDelta: any;
  private undoStack: Change[][] = [];
  private redoStack: Change[][] = [];
  private isProcessingUndoRedo: boolean = false;
  private isProcessingChange: boolean = false;

  constructor(quill: Quill, options: TrackChangesOptions) {
    this.quill = quill;
    this.options = {
      enabled: true,
      ...options
    };
    this.enabled = this.options.enabled ?? true;
    this.lastDelta = quill.getContents();
    this.initialize();
  }

  private initialize(): void {
    if (this.enabled) {
      this.addTrackChangesStyles();
      const debouncedTextChange = debounce(this.handleTextChange.bind(this), 100);
      this.quill.on('text-change', debouncedTextChange);
      console.log('[TrackChanges] Initialized and event handler attached.');
    }
  }

  private addTrackChangesStyles(): void {
    // Check if styles already exist
    if (document.getElementById('track-changes-styles')) return;
    
    const style = document.createElement('style');
    style.id = 'track-changes-styles';
    style.textContent = `
      /* Styles for inserted content (green highlights) */
      .ql-editor [style*="background: rgb(204, 232, 204)"],
      .ql-editor [style*="background-color: rgb(204, 232, 204)"],
      .ql-editor [style*="background:#cce8cc"],
      .ql-editor [style*="background: #cce8cc"] {
        background-color: rgba(200, 230, 201, 0.3) !important;
        border-bottom: 2px solid #4CAF50;
      }
      
      /* Styles for deleted content (red strikethrough) */
      .ql-editor [style*="text-decoration: line-through"],
      .ql-editor [style*="text-decoration:line-through"] {
        background-color: rgba(255, 205, 210, 0.3) !important;
        text-decoration: line-through !important;
        color: #C62828 !important;
      }
      
      /* Additional targeting for deleted content with background */
      .ql-editor [style*="background: rgb(255, 205, 210)"],
      .ql-editor [style*="background-color: rgb(255, 205, 210)"],
      .ql-editor [style*="background:#FFCDD2"],
      .ql-editor [style*="background: #FFCDD2"] {
        text-decoration: line-through !important;
      }
      
      /* When track changes is disabled, hide deleted content */
      .ql-editor.track-changes-disabled [style*="text-decoration: line-through"],
      .ql-editor.track-changes-disabled [style*="text-decoration:line-through"],
      .ql-editor.track-changes-disabled [style*="background: rgb(255, 205, 210)"],
      .ql-editor.track-changes-disabled [style*="background-color: rgb(255, 205, 210)"] {
        display: none !important;
      }
      
      /* When track changes is disabled, remove highlights from inserted content */
      .ql-editor.track-changes-disabled [style*="background: rgb(204, 232, 204)"],
      .ql-editor.track-changes-disabled [style*="background-color: rgb(204, 232, 204)"],
      .ql-editor.track-changes-disabled [style*="background:#cce8cc"],
      .ql-editor.track-changes-disabled [style*="background: #cce8cc"] {
        background-color: transparent !important;
        border-bottom: none !important;
      }
    `;
    document.head.appendChild(style);
  }

  public handleTextChange(): void {
    if (!this.enabled || this.isProcessingChange || this.isProcessingUndoRedo) return;
    this.isProcessingChange = true;
    try {
      const oldDelta = this.lastDelta;
      const newDelta = this.quill.getContents();
      if (JSON.stringify(oldDelta) === JSON.stringify(newDelta)) {
        this.isProcessingChange = false;
        return;
      }
      // Use Quill's Delta.diff for accurate diffing
      const diffDelta = oldDelta.diff(newDelta);
      let indexOld = 0;
      let indexNew = 0;
      let highlighted = new Delta();
      diffDelta.ops.forEach((op: any) => {
        if (op.retain) {
          highlighted.retain(op.retain);
          indexOld += op.retain;
          indexNew += op.retain;
        } else if (op.insert) {
          highlighted.retain(typeof op.insert === 'string' ? op.insert.length : 1, { background: '#cce8cc', color: '#003700' });
          indexNew += typeof op.insert === 'string' ? op.insert.length : 1;
        } else if (op.delete) {
          // Check if we're deleting newly added content (green highlights)
          let deletedText = '';
          let hasGreenHighlight = false;
          let remaining = op.delete;
          let currentIndex = 0;
          
          // Go through oldDelta to find what was deleted
          for (let i = 0; i < oldDelta.ops.length && remaining > 0; i++) {
            const opOld = oldDelta.ops[i];
            if (typeof opOld.insert === 'string') {
              const opLength = opOld.insert.length;
              
              if (indexOld >= currentIndex && indexOld < currentIndex + opLength) {
                const startWithinOp = indexOld - currentIndex;
                const take = Math.min(opLength - startWithinOp, remaining);
                deletedText += opOld.insert.substr(startWithinOp, take);
                
                // Check if this content had green highlight (was an addition)
                if (opOld.attributes && opOld.attributes.background === '#cce8cc') {
                  hasGreenHighlight = true;
                }
                
                remaining -= take;
              }
              currentIndex += opLength;
            } else if (opOld.insert) {
              // Handle embeds
              if (indexOld === currentIndex && remaining > 0) {
                deletedText += '\uFFFC';
                remaining--;
              }
              currentIndex++;
            }
          }
          
          // Only insert deleted text as strikethrough if it wasn't a green highlight (addition)
          if (deletedText && !hasGreenHighlight) {
            highlighted.insert(deletedText, { strike: true, color: '#C62828', background: '#FFCDD2' });
          }
          indexOld += op.delete;
        }
      });
      // Preserve cursor position
      const selection = this.quill.getSelection();
      // Apply the highlighted diff to the newDelta correctly
      const result = newDelta.compose(highlighted);
      this.quill.setContents(result);
      if (selection) {
        this.quill.setSelection(selection.index, selection.length, 'silent');
      }
      this.lastDelta = this.quill.getContents();
      console.log('[TrackChanges] Applied Delta.diff with true redline highlights.');
    } finally {
      this.isProcessingChange = false;
    }
  }

  public isEnabled(): boolean {
    return this.enabled;
  }

  public enable(): void {
    if (!this.enabled) {
      this.enabled = true;
      // Remove the CSS class that hides deleted content
      const editor = this.quill.container.querySelector('.ql-editor');
      if (editor) {
        editor.classList.remove('track-changes-disabled');
        console.log('[TrackChanges] Enabled. Classes:', editor.className);
      }
    }
  }

  public disable(): void {
    if (this.enabled) {
      this.enabled = false;
      // Add CSS class to hide deleted content
      const editor = this.quill.container.querySelector('.ql-editor');
      if (editor) {
        editor.classList.add('track-changes-disabled');
        console.log('[TrackChanges] Disabled - deleted content hidden via CSS. Classes:', editor.className);
      }
    }
  }

  public getChanges(): Change[] {
    return this.changes;
  }

  public getPendingChanges(): Change[] {
    return this.getChanges().filter(change => !change.accepted && !change.rejected);
  }

  public acceptChange(id: string): boolean {
    const change = this.changes.find(c => c.id === id);
    if (change && !change.accepted && !change.rejected) {
      change.accepted = true;
      this.notifyChangesUpdate();
      return true;
    }
    return false;
  }

  public rejectChange(id: string): boolean {
    const change = this.changes.find(c => c.id === id);
    if (change && !change.accepted && !change.rejected) {
      change.rejected = true;
      this.notifyChangesUpdate();
      return true;
    }
    return false;
  }

  public acceptAllChanges(): void {
    this.changes.forEach(change => {
      if (!change.accepted && !change.rejected) {
        change.accepted = true;
      }
    });
    this.notifyChangesUpdate();
  }

  public rejectAllChanges(): void {
    this.changes.forEach(change => {
      if (!change.accepted && !change.rejected) {
        change.rejected = true;
      }
    });
    this.quill.setContents(this.lastDelta);
    this.notifyChangesUpdate();
  }

  public clearChanges(): void {
    this.changes = [];
    this.quill.setContents(this.lastDelta);
    this.notifyChangesUpdate();
  }

  public processDelta(): void {
    this.handleTextChange();
  }

  public updateOptions(options: Partial<TrackChangesOptions>): void {
    this.options = { ...this.options, ...options };
    if (options.enabled !== undefined) {
      options.enabled ? this.enable() : this.disable();
    }
  }

  public getOptions(): TrackChangesOptions {
    return { ...this.options };
  }

  public getVersionHistory(): any[] {
    return [this.lastDelta];
  }

  public createVersion(name?: string): any {
    return { delta: this.lastDelta };
  }

  public loadVersion(version: any): void {
    if (version && version.delta) {
      this.quill.setContents(version.delta);
      this.lastDelta = version.delta;
    }
  }

  private notifyChangesUpdate(): void {
    if (this.options.onChangesUpdate) {
      this.options.onChangesUpdate(this.getChanges());
    }
  }

  public undo(): void {
    // Not implemented for Delta-based diffing
  }

  public redo(): void {
    // Not implemented for Delta-based diffing
  }
} 