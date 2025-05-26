import { Quill } from 'quill';

export interface Change {
  id: string;
  type: 'insert' | 'delete' | 'format';
  author: string;
  timestamp: number;
  text?: string;
  length?: number;
  attributes?: Record<string, any>;
  accepted?: boolean;
  rejected?: boolean;
}

export interface TrackChangesOptions {
  enabled?: boolean;
  currentUser: string;
  onChangesUpdate?: (changes: Change[]) => void;
}

export interface TrackChangesPlugin {
  isEnabled(): boolean;
  enable(): void;
  disable(): void;
  getChanges(): Change[];
  acceptChange(id: string): boolean;
  rejectChange(id: string): boolean;
  clearChanges(): void;
  handleTextChange(delta: any): void;
  updateOptions(options: Partial<TrackChangesOptions>): void;
  getOptions(): TrackChangesOptions;
} 