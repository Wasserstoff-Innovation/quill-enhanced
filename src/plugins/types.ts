export interface Change {
  id: string;
  type: 'insert' | 'delete' | 'format' | 'modify';
  author: string;
  timestamp: number;
  text?: string;
  length?: number;
  index?: number;
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
  handleTextChange(delta: any, oldDelta?: any, source?: string): void;
  updateOptions(options: Partial<TrackChangesOptions>): void;
  getOptions(): TrackChangesOptions;
}

export interface PluginOptions {
  enabled?: boolean;
} 