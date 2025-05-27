import { storageManager, type StorageOptions } from '../utils/storageUtils';

export interface AutosaveOptions {
  enabled?: boolean;
  interval?: number;
  documentId?: string;
  version?: number;
  debounceDelay?: number;
  storageOptions?: StorageOptions;
  onSave?: (content: any, draftId: string) => void;
  onError?: (error: Error) => void;
  onDraftRecovered?: (content: any) => void;
}

export class AutosavePlugin {
  private quill: any;
  private options: Required<AutosaveOptions>;
  private timer: NodeJS.Timeout | null = null;
  private debounceTimer: NodeJS.Timeout | null = null;
  private lastContent: any | null = null;
  private isTyping: boolean = false;

  constructor(quill: any, options: AutosaveOptions = {}) {
    this.quill = quill;
    this.options = {
      enabled: true,
      interval: 30000, // 30 seconds default
      documentId: 'default',
      version: 1,
      debounceDelay: 2000, // 2 seconds after stopping typing
      storageOptions: {},
      onSave: () => {},
      onError: () => {},
      onDraftRecovered: () => {},
      ...options
    };

    this.setupEventListeners();

    if (this.options.enabled) {
      this.start();
      this.checkForDrafts();
    }
  }

  private setupEventListeners(): void {
    // Listen for text changes to detect typing
    this.quill.on('text-change', () => {
      this.isTyping = true;
      this.debouncedSave();
    });

    // Listen for selection changes to detect when user stops typing
    this.quill.on('selection-change', () => {
      if (this.isTyping) {
        this.isTyping = false;
        this.debouncedSave();
      }
    });
  }

  private async checkForDrafts(): Promise<void> {
    try {
      const latestDraft = await storageManager.getLatestDraft(this.options.documentId);
      if (latestDraft && latestDraft.content) {
        this.options.onDraftRecovered(latestDraft.content);
      }
    } catch (error) {
      this.options.onError(error instanceof Error ? error : new Error(String(error)));
    }
  }

  private debouncedSave(): void {
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }

    this.debounceTimer = setTimeout(() => {
      this.save();
    }, this.options.debounceDelay);
  }

  private start(): void {
    if (this.timer) {
      clearInterval(this.timer);
    }

    this.timer = setInterval(() => {
      this.save();
    }, this.options.interval);
  }

  private stop(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
      this.debounceTimer = null;
    }
  }

  public async save(): Promise<void> {
    try {
      const content = this.quill.getContents();
      
      // Only save if content has changed
      if (!this.lastContent || !content.equals(this.lastContent)) {
        this.lastContent = content;
        
        // Save to storage
        const draftId = await storageManager.saveDraft(
          this.options.documentId,
          content,
          undefined, // changes - can be added later
          this.options.version
        );
        
        this.options.onSave(content, draftId);
      }
    } catch (error) {
      this.options.onError(error instanceof Error ? error : new Error(String(error)));
    }
  }

  public enable(): void {
    this.options.enabled = true;
    this.start();
  }

  public disable(): void {
    this.options.enabled = false;
    this.stop();
  }

  public setInterval(interval: number): void {
    this.options.interval = interval;
    if (this.options.enabled) {
      this.start();
    }
  }

  public async clearDrafts(): Promise<void> {
    try {
      await storageManager.clearDrafts(this.options.documentId);
    } catch (error) {
      this.options.onError(error instanceof Error ? error : new Error(String(error)));
    }
  }

  public async getDrafts(): Promise<any[]> {
    try {
      return await storageManager.getDrafts(this.options.documentId);
    } catch (error) {
      this.options.onError(error instanceof Error ? error : new Error(String(error)));
      return [];
    }
  }

  public async getStorageStats(): Promise<any> {
    try {
      return await storageManager.getStorageStats();
    } catch (error) {
      this.options.onError(error instanceof Error ? error : new Error(String(error)));
      return null;
    }
  }

  public async checkVersionConflict(): Promise<any> {
    try {
      return await storageManager.checkVersionConflict(this.options.documentId, this.options.version);
    } catch (error) {
      this.options.onError(error instanceof Error ? error : new Error(String(error)));
      return { hasConflict: false, conflictingDrafts: [] };
    }
  }

  public destroy(): void {
    this.stop();
    // Remove event listeners
    this.quill.off('text-change');
    this.quill.off('selection-change');
  }
} 