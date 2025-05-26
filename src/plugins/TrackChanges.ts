import { Quill } from 'quill';
import { Change, TrackChangesOptions, TrackChangesPlugin } from './types';

export class TrackChanges implements TrackChangesPlugin {
  private quill: Quill;
  private changes: Change[] = [];
  private options: TrackChangesOptions;
  private enabled: boolean;

  constructor(quill: Quill, options: TrackChangesOptions) {
    this.quill = quill;
    this.options = {
      enabled: true,
      ...options
    };
    this.enabled = this.options.enabled ?? true;
    this.initialize();
  }

  private initialize(): void {
    if (this.enabled) {
      this.quill.on('text-change', this.handleTextChange.bind(this));
    }
  }

  public isEnabled(): boolean {
    return this.enabled;
  }

  public enable(): void {
    if (!this.enabled) {
      this.enabled = true;
      this.quill.on('text-change', this.handleTextChange.bind(this));
    }
  }

  public disable(): void {
    if (this.enabled) {
      this.enabled = false;
      this.quill.off('text-change', this.handleTextChange.bind(this));
    }
  }

  public getChanges(): Change[] {
    return [...this.changes];
  }

  public getPendingChanges(): Change[] {
    return this.changes.filter(change => !change.accepted && !change.rejected);
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
    this.notifyChangesUpdate();
  }

  public clearChanges(): void {
    this.changes = [];
    this.notifyChangesUpdate();
  }

  public processDelta(delta: any): void {
    this.handleTextChange(delta);
  }

  public handleTextChange(delta: any): void {
    if (!this.enabled) return;

    const change: Change = {
      id: Math.random().toString(36).substr(2, 9),
      type: this.determineChangeType(delta),
      author: this.options.currentUser,
      timestamp: Date.now(),
      text: delta.ops?.[0]?.insert,
      length: delta.ops?.[0]?.delete,
      attributes: delta.ops?.[0]?.attributes
    };

    this.changes.push(change);
    this.notifyChangesUpdate();
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

  private determineChangeType(delta: any): 'insert' | 'delete' | 'format' {
    if (delta.ops?.[0]?.insert) return 'insert';
    if (delta.ops?.[0]?.delete) return 'delete';
    return 'format';
  }

  private notifyChangesUpdate(): void {
    if (this.options.onChangesUpdate) {
      this.options.onChangesUpdate(this.getChanges());
    }
  }
} 