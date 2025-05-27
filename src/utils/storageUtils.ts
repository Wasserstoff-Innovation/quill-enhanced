import type { DeltaOperation } from 'quill';

export interface DraftMetadata {
  id: string;
  documentId: string;
  version: number;
  timestamp: number;
  size: number;
  sessionId: string;
  author?: string;
}

export interface StoredDraft {
  metadata: DraftMetadata;
  content: any; // Delta content
  changes?: any[]; // Track changes data
}

export interface StorageOptions {
  useIndexedDB?: boolean;
  maxDrafts?: number;
  maxAge?: number; // in milliseconds
  storageQuota?: number; // in bytes
}

class StorageManager {
  private dbName = 'quill-enhanced-storage';
  private dbVersion = 1;
  private storeName = 'drafts';
  private sessionId: string;
  private options: Required<StorageOptions>;

  constructor(options: StorageOptions = {}) {
    this.sessionId = this.generateSessionId();
    this.options = {
      useIndexedDB: true,
      maxDrafts: 10,
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      storageQuota: 50 * 1024 * 1024, // 50MB
      ...options
    };
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Initialize IndexedDB
   */
  private async initIndexedDB(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.dbVersion);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        
        if (!db.objectStoreNames.contains(this.storeName)) {
          const store = db.createObjectStore(this.storeName, { keyPath: 'metadata.id' });
          store.createIndex('documentId', 'metadata.documentId', { unique: false });
          store.createIndex('timestamp', 'metadata.timestamp', { unique: false });
          store.createIndex('sessionId', 'metadata.sessionId', { unique: false });
        }
      };
    });
  }

  /**
   * Save draft to storage
   */
  async saveDraft(documentId: string, content: any, changes?: any[], version: number = 1): Promise<string> {
    const draftId = `draft_${documentId}_${Date.now()}`;
    const contentSize = this.calculateSize(content);
    
    const draft: StoredDraft = {
      metadata: {
        id: draftId,
        documentId,
        version,
        timestamp: Date.now(),
        size: contentSize,
        sessionId: this.sessionId
      },
      content,
      changes
    };

    if (this.options.useIndexedDB && this.isIndexedDBSupported()) {
      await this.saveDraftIndexedDB(draft);
    } else {
      await this.saveDraftLocalStorage(draft);
    }

    // Clean up old drafts
    await this.cleanupOldDrafts(documentId);

    return draftId;
  }

  /**
   * Load draft from storage
   */
  async loadDraft(draftId: string): Promise<StoredDraft | null> {
    if (this.options.useIndexedDB && this.isIndexedDBSupported()) {
      return await this.loadDraftIndexedDB(draftId);
    } else {
      return await this.loadDraftLocalStorage(draftId);
    }
  }

  /**
   * Get all drafts for a document
   */
  async getDrafts(documentId: string): Promise<DraftMetadata[]> {
    if (this.options.useIndexedDB && this.isIndexedDBSupported()) {
      return await this.getDraftsIndexedDB(documentId);
    } else {
      return await this.getDraftsLocalStorage(documentId);
    }
  }

  /**
   * Get the latest draft for a document
   */
  async getLatestDraft(documentId: string): Promise<StoredDraft | null> {
    const drafts = await this.getDrafts(documentId);
    if (drafts.length === 0) return null;

    const latest = drafts.sort((a, b) => b.timestamp - a.timestamp)[0];
    return await this.loadDraft(latest.id);
  }

  /**
   * Delete draft
   */
  async deleteDraft(draftId: string): Promise<void> {
    if (this.options.useIndexedDB && this.isIndexedDBSupported()) {
      await this.deleteDraftIndexedDB(draftId);
    } else {
      await this.deleteDraftLocalStorage(draftId);
    }
  }

  /**
   * Clear all drafts for a document
   */
  async clearDrafts(documentId: string): Promise<void> {
    const drafts = await this.getDrafts(documentId);
    await Promise.all(drafts.map(draft => this.deleteDraft(draft.id)));
  }

  /**
   * Check for version conflicts
   */
  async checkVersionConflict(documentId: string, currentVersion: number): Promise<{
    hasConflict: boolean;
    conflictingDrafts: DraftMetadata[];
  }> {
    const drafts = await this.getDrafts(documentId);
    const conflictingDrafts = drafts.filter(draft => 
      draft.version !== currentVersion && 
      draft.sessionId !== this.sessionId
    );

    return {
      hasConflict: conflictingDrafts.length > 0,
      conflictingDrafts
    };
  }

  /**
   * Get storage usage statistics
   */
  async getStorageStats(): Promise<{
    used: number;
    available: number;
    quota: number;
    draftCount: number;
  }> {
    if (this.options.useIndexedDB && this.isIndexedDBSupported()) {
      return await this.getStorageStatsIndexedDB();
    } else {
      return await this.getStorageStatsLocalStorage();
    }
  }

  // IndexedDB implementations
  private async saveDraftIndexedDB(draft: StoredDraft): Promise<void> {
    const db = await this.initIndexedDB();
    const transaction = db.transaction([this.storeName], 'readwrite');
    const store = transaction.objectStore(this.storeName);
    
    return new Promise((resolve, reject) => {
      const request = store.put(draft);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  private async loadDraftIndexedDB(draftId: string): Promise<StoredDraft | null> {
    const db = await this.initIndexedDB();
    const transaction = db.transaction([this.storeName], 'readonly');
    const store = transaction.objectStore(this.storeName);
    
    return new Promise((resolve, reject) => {
      const request = store.get(draftId);
      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
  }

  private async getDraftsIndexedDB(documentId: string): Promise<DraftMetadata[]> {
    const db = await this.initIndexedDB();
    const transaction = db.transaction([this.storeName], 'readonly');
    const store = transaction.objectStore(this.storeName);
    const index = store.index('documentId');
    
    return new Promise((resolve, reject) => {
      const request = index.getAll(documentId);
      request.onsuccess = () => {
        const drafts = request.result.map((draft: StoredDraft) => draft.metadata);
        resolve(drafts);
      };
      request.onerror = () => reject(request.error);
    });
  }

  private async deleteDraftIndexedDB(draftId: string): Promise<void> {
    const db = await this.initIndexedDB();
    const transaction = db.transaction([this.storeName], 'readwrite');
    const store = transaction.objectStore(this.storeName);
    
    return new Promise((resolve, reject) => {
      const request = store.delete(draftId);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  private async getStorageStatsIndexedDB(): Promise<{
    used: number;
    available: number;
    quota: number;
    draftCount: number;
  }> {
    const db = await this.initIndexedDB();
    const transaction = db.transaction([this.storeName], 'readonly');
    const store = transaction.objectStore(this.storeName);
    
    return new Promise((resolve, reject) => {
      const request = store.getAll();
      request.onsuccess = () => {
        const drafts = request.result;
        const used = drafts.reduce((total: number, draft: StoredDraft) => total + draft.metadata.size, 0);
        
        resolve({
          used,
          available: this.options.storageQuota - used,
          quota: this.options.storageQuota,
          draftCount: drafts.length
        });
      };
      request.onerror = () => reject(request.error);
    });
  }

  // LocalStorage implementations
  private async saveDraftLocalStorage(draft: StoredDraft): Promise<void> {
    try {
      const key = `quill_draft_${draft.metadata.id}`;
      localStorage.setItem(key, JSON.stringify(draft));
      
      // Update index
      const indexKey = 'quill_draft_index';
      const index = JSON.parse(localStorage.getItem(indexKey) || '{}');
      if (!index[draft.metadata.documentId]) {
        index[draft.metadata.documentId] = [];
      }
      index[draft.metadata.documentId].push(draft.metadata);
      localStorage.setItem(indexKey, JSON.stringify(index));
    } catch (error) {
      throw new Error(`Failed to save draft to localStorage: ${error}`);
    }
  }

  private async loadDraftLocalStorage(draftId: string): Promise<StoredDraft | null> {
    try {
      const key = `quill_draft_${draftId}`;
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('Failed to load draft from localStorage:', error);
      return null;
    }
  }

  private async getDraftsLocalStorage(documentId: string): Promise<DraftMetadata[]> {
    try {
      const indexKey = 'quill_draft_index';
      const index = JSON.parse(localStorage.getItem(indexKey) || '{}');
      return index[documentId] || [];
    } catch (error) {
      console.error('Failed to get drafts from localStorage:', error);
      return [];
    }
  }

  private async deleteDraftLocalStorage(draftId: string): Promise<void> {
    try {
      const key = `quill_draft_${draftId}`;
      localStorage.removeItem(key);
      
      // Update index
      const indexKey = 'quill_draft_index';
      const index = JSON.parse(localStorage.getItem(indexKey) || '{}');
      
      for (const docId in index) {
        index[docId] = index[docId].filter((meta: DraftMetadata) => meta.id !== draftId);
        if (index[docId].length === 0) {
          delete index[docId];
        }
      }
      
      localStorage.setItem(indexKey, JSON.stringify(index));
    } catch (error) {
      console.error('Failed to delete draft from localStorage:', error);
    }
  }

  private async getStorageStatsLocalStorage(): Promise<{
    used: number;
    available: number;
    quota: number;
    draftCount: number;
  }> {
    try {
      let used = 0;
      let draftCount = 0;
      
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key?.startsWith('quill_draft_')) {
          const value = localStorage.getItem(key);
          if (value) {
            used += new Blob([value]).size;
            draftCount++;
          }
        }
      }
      
      // Estimate localStorage quota (usually 5-10MB)
      const quota = 5 * 1024 * 1024; // 5MB
      
      return {
        used,
        available: quota - used,
        quota,
        draftCount
      };
    } catch (error) {
      console.error('Failed to get storage stats:', error);
      return { used: 0, available: 0, quota: 0, draftCount: 0 };
    }
  }

  // Utility methods
  private async cleanupOldDrafts(documentId: string): Promise<void> {
    const drafts = await this.getDrafts(documentId);
    const now = Date.now();
    
    // Remove drafts older than maxAge
    const oldDrafts = drafts.filter(draft => 
      now - draft.timestamp > this.options.maxAge
    );
    
    // Remove excess drafts (keep only maxDrafts)
    const sortedDrafts = drafts.sort((a, b) => b.timestamp - a.timestamp);
    const excessDrafts = sortedDrafts.slice(this.options.maxDrafts);
    
    const draftsToDelete = [...oldDrafts, ...excessDrafts];
    await Promise.all(draftsToDelete.map(draft => this.deleteDraft(draft.id)));
  }

  private calculateSize(content: any): number {
    return new Blob([JSON.stringify(content)]).size;
  }

  private isIndexedDBSupported(): boolean {
    return typeof indexedDB !== 'undefined';
  }
}

// Export singleton instance
export const storageManager = new StorageManager();

// Export class for custom instances
export { StorageManager }; 