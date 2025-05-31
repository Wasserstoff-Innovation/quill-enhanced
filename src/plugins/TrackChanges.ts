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
  private textChangeHandler: any;

  constructor(quill: Quill, options: TrackChangesOptions) {
    this.quill = quill;
    this.options = {
      enabled: true,
      ...options
    };
    this.enabled = this.options.enabled ?? true;
    this.lastDelta = quill.getContents();
    // Create the handler once with proper signature
    this.textChangeHandler = debounce((delta: any, oldDelta: any, source: string) => {
      this.handleTextChange(delta, oldDelta, source);
    }, 10);
    this.initialize();
  }

  private initialize(): void {
    this.addTrackChangesStyles();
    if (this.enabled) {
      // Attach the handler
      this.quill.on('text-change', this.textChangeHandler);
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

  public handleTextChange(delta: any, oldDelta: any, source: string): void {
    if (!this.enabled || this.isProcessingChange) return;
    
    // Update our reference for any change
    const currentContents = this.quill.getContents();
    
    // For non-user sources (like undo/redo), just update our reference
    if (source !== 'user') {
      this.lastDelta = currentContents;
      return;
    }
    
    // For user edits, apply track changes
    this.isProcessingChange = true;
    try {
      const oldContents = this.lastDelta;
      let newContents = currentContents;
      
      // Normalize non-breaking spaces to regular spaces in the new content
      // This helps prevent fragmentation issues
      const normalizedOps = newContents.ops.map((op: any) => {
        if (op.insert && typeof op.insert === 'string') {
          return {
            ...op,
            insert: op.insert.replace(/\u00A0/g, ' ')
          };
        }
        return op;
      });
      newContents = new Delta(normalizedOps);
      
      // Quick check if anything changed
      if (JSON.stringify(oldContents) === JSON.stringify(newContents)) {
        this.isProcessingChange = false;
        return;
      }
      
      // Use Quill's Delta.diff for accurate diffing
      const diffDelta = oldContents.diff(newContents);
      let highlighted = new Delta();
      let processedIndex = 0;
      
      diffDelta.ops.forEach((op: any) => {
        if (op.retain) {
          highlighted.retain(op.retain);
          processedIndex += op.retain;
        } else if (op.insert) {
          // New content - highlight as insertion
          const insertLength = typeof op.insert === 'string' ? op.insert.length : 1;
          highlighted.retain(insertLength, { background: '#cce8cc', color: '#003700' });
        } else if (op.delete) {
          // Extract deleted content from the old delta
          let deletedText = '';
          let deleteCount = op.delete;
          let currentPos = 0;
          
          // Collect all deleted text
          for (const oldOp of oldContents.ops) {
            if (!oldOp.insert) continue;
            
            const opLength = typeof oldOp.insert === 'string' ? oldOp.insert.length : 1;
            const opEndPos = currentPos + opLength;
            
            // Check if this operation contains any part of the deletion
            if (opEndPos > processedIndex && currentPos < processedIndex + deleteCount) {
              const deleteStart = Math.max(0, processedIndex - currentPos);
              const deleteEnd = Math.min(opLength, processedIndex + deleteCount - currentPos);
              
              if (typeof oldOp.insert === 'string') {
                const extracted = oldOp.insert.substring(deleteStart, deleteEnd);
                // Check if this was previously highlighted as an addition
                const wasAddition = oldOp.attributes && oldOp.attributes.background === '#cce8cc';
                
                if (!wasAddition) {
                  deletedText += extracted;
                }
              }
            }
            
            currentPos = opEndPos;
            if (currentPos >= processedIndex + deleteCount) break;
          }
          
          // Insert deleted text with strikethrough
          if (deletedText) {
            highlighted.insert(deletedText, { 
              strike: true, 
              color: '#C62828', 
              background: '#FFCDD2' 
            });
          }
          
          processedIndex += op.delete;
        }
      });
      
      // Apply the changes
      const selection = this.quill.getSelection();
      const result = newContents.compose(highlighted);
      this.quill.setContents(result, 'silent');
      
      // Restore selection
      if (selection) {
        this.quill.setSelection(selection.index, selection.length, 'silent');
      }
      
      this.lastDelta = this.quill.getContents();
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
      // Re-attach the event handler
      this.quill.on('text-change', this.textChangeHandler);
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
      // Remove the event handler to stop tracking
      this.quill.off('text-change', this.textChangeHandler);
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
    // This method is called manually, so we simulate a user change
    this.handleTextChange(null, null, 'user');
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
} 