import { jest } from '@jest/globals';
import { StorageManager, storageManager } from '../storageUtils';

// Mock IndexedDB
const mockIndexedDB = {
  open: jest.fn(),
  deleteDatabase: jest.fn(),
};

const mockIDBDatabase = {
  transaction: jest.fn(),
  close: jest.fn(),
  objectStoreNames: {
    contains: jest.fn().mockReturnValue(false)
  }
};

const mockIDBTransaction = {
  objectStore: jest.fn(),
  oncomplete: null,
  onerror: null,
  onabort: null
};

const mockIDBObjectStore = {
  put: jest.fn(),
  get: jest.fn(),
  delete: jest.fn(),
  getAll: jest.fn(),
  createIndex: jest.fn(),
  index: jest.fn()
};

const mockIDBIndex = {
  getAll: jest.fn()
};

const mockIDBRequest = {
  onsuccess: null as any,
  onerror: null as any,
  result: null as any,
  error: null as any
};

// Setup IndexedDB mocks
Object.defineProperty(global, 'indexedDB', {
  value: mockIndexedDB,
  writable: true
});

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
  length: 0,
  key: jest.fn()
};

Object.defineProperty(global, 'localStorage', {
  value: localStorageMock,
  writable: true
});

// Mock Blob
(global as any).Blob = jest.fn().mockImplementation((...args: any[]) => ({
  size: JSON.stringify(args[0] || []).length,
  type: args[1]?.type || 'text/plain',
  arrayBuffer: jest.fn().mockImplementation(() => Promise.resolve(new ArrayBuffer(0))),
  text: jest.fn().mockImplementation(() => Promise.resolve(''))
}));

describe('StorageManager', () => {
  let storage: StorageManager;
  
  const mockDraft = {
    metadata: {
      id: 'draft_test_123',
      documentId: 'test-doc',
      version: 1,
      timestamp: Date.now(),
      size: 100,
      sessionId: 'session_123'
    },
    content: { ops: [{ insert: 'Hello World\n' }] }
  };

  beforeEach(() => {
    jest.clearAllMocks();
    storage = new StorageManager({ useIndexedDB: false }); // Use localStorage for simpler testing
  });

  describe('localStorage operations', () => {

    beforeEach(() => {
      localStorageMock.getItem.mockReturnValue(null);
      localStorageMock.setItem.mockImplementation(() => {});
      localStorageMock.removeItem.mockImplementation(() => {});
    });

    describe('saveDraft', () => {
      it('should save draft to localStorage', async () => {
        const draftId = await storage.saveDraft('test-doc', mockDraft.content);

        expect(localStorageMock.setItem).toHaveBeenCalledWith(
          expect.stringMatching(/^quill_draft_draft_test-doc_/),
          expect.stringContaining('Hello World')
        );

        expect(localStorageMock.setItem).toHaveBeenCalledWith(
          'quill_draft_index',
          expect.any(String)
        );

        expect(draftId).toMatch(/^draft_test-doc_\d+$/);
      });

      it('should handle localStorage errors', async () => {
        localStorageMock.setItem.mockImplementation(() => {
          throw new Error('Storage quota exceeded');
        });

        await expect(storage.saveDraft('test-doc', mockDraft.content))
          .rejects.toThrow('Failed to save draft to localStorage');
      });
    });

    describe('loadDraft', () => {
      it('should load draft from localStorage', async () => {
        const draftData = JSON.stringify(mockDraft);
        localStorageMock.getItem.mockReturnValue(draftData);

        const result = await storage.loadDraft('draft_test_123');

        expect(localStorageMock.getItem).toHaveBeenCalledWith('quill_draft_draft_test_123');
        expect(result).toEqual(mockDraft);
      });

      it('should return null for non-existent draft', async () => {
        localStorageMock.getItem.mockReturnValue(null);

        const result = await storage.loadDraft('non-existent');

        expect(result).toBeNull();
      });

      it('should handle JSON parse errors', async () => {
        localStorageMock.getItem.mockReturnValue('invalid json');

        const result = await storage.loadDraft('draft_test_123');

        expect(result).toBeNull();
      });
    });

    describe('getDrafts', () => {
      it('should get drafts for a document', async () => {
        const index = {
          'test-doc': [mockDraft.metadata]
        };
        localStorageMock.getItem.mockReturnValue(JSON.stringify(index));

        const result = await storage.getDrafts('test-doc');

        expect(result).toEqual([mockDraft.metadata]);
      });

      it('should return empty array for document with no drafts', async () => {
        localStorageMock.getItem.mockReturnValue('{}');

        const result = await storage.getDrafts('non-existent-doc');

        expect(result).toEqual([]);
      });
    });

    describe('getLatestDraft', () => {
      it('should get the latest draft for a document', async () => {
        const olderDraft = { ...mockDraft.metadata, timestamp: Date.now() - 1000 };
        const newerDraft = { ...mockDraft.metadata, timestamp: Date.now() };
        
        const index = {
          'test-doc': [olderDraft, newerDraft]
        };
        
        localStorageMock.getItem
          .mockReturnValueOnce(JSON.stringify(index))
          .mockReturnValueOnce(JSON.stringify(mockDraft));

        const result = await storage.getLatestDraft('test-doc');

        expect(result).toEqual(mockDraft);
      });

      it('should return null if no drafts exist', async () => {
        localStorageMock.getItem.mockReturnValue('{}');

        const result = await storage.getLatestDraft('test-doc');

        expect(result).toBeNull();
      });
    });

      describe('deleteDraft', () => {
    it('should delete draft from localStorage', async () => {
      const index = {
        'test-doc': [mockDraft.metadata]
      };
      localStorageMock.getItem.mockReturnValue(JSON.stringify(index));

      await storage.deleteDraft('draft_test_123');

      expect(localStorageMock.removeItem).toHaveBeenCalledWith('quill_draft_draft_test_123');
      // The index should be updated to remove the deleted draft
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'quill_draft_index',
        '{}'
      );
    });
  });

    describe('clearDrafts', () => {
      it('should clear all drafts for a document', async () => {
        const index = {
          'test-doc': [mockDraft.metadata, { ...mockDraft.metadata, id: 'draft_test_456' }]
        };
        localStorageMock.getItem.mockReturnValue(JSON.stringify(index));

        await storage.clearDrafts('test-doc');

        expect(localStorageMock.removeItem).toHaveBeenCalledTimes(2);
      });
    });

    describe('checkVersionConflict', () => {
      it('should detect version conflicts', async () => {
        const conflictingDraft = {
          ...mockDraft.metadata,
          version: 2,
          sessionId: 'different-session'
        };
        
        const index = {
          'test-doc': [conflictingDraft]
        };
        localStorageMock.getItem.mockReturnValue(JSON.stringify(index));

        const result = await storage.checkVersionConflict('test-doc', 1);

        expect(result.hasConflict).toBe(true);
        expect(result.conflictingDrafts).toHaveLength(1);
      });

      it('should not detect conflicts for same session', async () => {
        // Use the same session ID as the storage instance
        const sameDraft = {
          ...mockDraft.metadata,
          sessionId: storage['sessionId']
        };
        const index = {
          'test-doc': [sameDraft]
        };
        localStorageMock.getItem.mockReturnValue(JSON.stringify(index));

        const result = await storage.checkVersionConflict('test-doc', 2);

        expect(result.hasConflict).toBe(false);
      });
    });

    describe('getStorageStats', () => {
      it('should calculate storage statistics', async () => {
        localStorageMock.length = 3;
        localStorageMock.key
          .mockReturnValueOnce('quill_draft_1')
          .mockReturnValueOnce('quill_draft_2')
          .mockReturnValueOnce('other_key');
        
        localStorageMock.getItem
          .mockReturnValueOnce('{"test": "data1"}')
          .mockReturnValueOnce('{"test": "data2"}')
          .mockReturnValueOnce(null);

        const result = await storage.getStorageStats();

        expect(result.draftCount).toBe(2);
        expect(result.used).toBeGreaterThan(0);
        expect(result.quota).toBe(5 * 1024 * 1024); // 5MB
      });
    });
  });

  describe('IndexedDB operations', () => {
    beforeEach(() => {
      storage = new StorageManager({ useIndexedDB: true });
      
      // Setup IndexedDB mocks
      mockIndexedDB.open.mockImplementation(() => {
        const request = { ...mockIDBRequest };
        setTimeout(() => {
          request.result = mockIDBDatabase;
          if (request.onsuccess) request.onsuccess();
        }, 0);
        return request;
      });

      mockIDBDatabase.transaction.mockReturnValue(mockIDBTransaction);
      mockIDBTransaction.objectStore.mockReturnValue(mockIDBObjectStore);
      mockIDBObjectStore.index.mockReturnValue(mockIDBIndex);
      
      // Setup proper IndexedDB getAll mock
      mockIDBIndex.getAll.mockImplementation(() => {
        const request = { ...mockIDBRequest };
        setTimeout(() => {
          request.result = [mockDraft];
          if (request.onsuccess) request.onsuccess();
        }, 0);
        return request;
      });
    });

    it('should initialize IndexedDB', async () => {
      const mockDraft = {
        metadata: {
          id: 'draft_test_123',
          documentId: 'test-doc',
          version: 1,
          timestamp: Date.now(),
          size: 100,
          sessionId: 'session_123'
        },
        content: { ops: [{ insert: 'Hello World\n' }] }
      };

      mockIDBObjectStore.put.mockImplementation(() => {
        const request = { ...mockIDBRequest };
        setTimeout(() => {
          if (request.onsuccess) request.onsuccess();
        }, 0);
        return request;
      });

      const draftId = await storage.saveDraft('test-doc', mockDraft.content);

      expect(mockIndexedDB.open).toHaveBeenCalledWith('quill-enhanced-storage', 1);
      expect(draftId).toMatch(/^draft_test-doc_\d+$/);
    });
  });

  describe('utility methods', () => {
    it('should detect IndexedDB support', () => {
      expect(storage['isIndexedDBSupported']()).toBe(true);
      
      // Test when IndexedDB is not available
      const originalIndexedDB = global.indexedDB;
      (global as any).indexedDB = undefined;
      
      // Create a new storage instance to test the detection
      const testStorage = new StorageManager({ useIndexedDB: false });
      expect(testStorage['isIndexedDBSupported']()).toBe(false);
      
      // Restore
      global.indexedDB = originalIndexedDB;
    });

    it('should calculate content size', () => {
      const content = { ops: [{ insert: 'Hello World\n' }] };
      const size = storage['calculateSize'](content);
      
      expect(size).toBeGreaterThan(0);
      expect(typeof size).toBe('number');
    });
  });

  describe('cleanup operations', () => {
    it('should cleanup old drafts', async () => {
      const oldTimestamp = Date.now() - (8 * 24 * 60 * 60 * 1000); // 8 days ago
      const oldDraft = { ...mockDraft.metadata, timestamp: oldTimestamp };
      
      const index = {
        'test-doc': [oldDraft]
      };
      localStorageMock.getItem.mockReturnValue(JSON.stringify(index));

      await storage.saveDraft('test-doc', { ops: [] });

      // Should have attempted to clean up old draft
      expect(localStorageMock.removeItem).toHaveBeenCalled();
    });

    it('should limit number of drafts per document', async () => {
      const storage = new StorageManager({ useIndexedDB: false, maxDrafts: 2 });
      
      // Create 3 drafts (should keep only 2 newest)
      const drafts = Array.from({ length: 3 }, (_, i) => ({
        ...mockDraft.metadata,
        id: `draft_${i}`,
        timestamp: Date.now() - (i * 1000)
      }));
      
      const index = { 'test-doc': drafts };
      localStorageMock.getItem.mockReturnValue(JSON.stringify(index));

      await storage.saveDraft('test-doc', { ops: [] });

      // Should have removed the oldest draft
      expect(localStorageMock.removeItem).toHaveBeenCalled();
    });
  });
});

describe('storageManager singleton', () => {
  it('should provide a singleton instance', () => {
    expect(storageManager).toBeInstanceOf(StorageManager);
  });

  it('should use IndexedDB by default', () => {
    expect(storageManager['options'].useIndexedDB).toBe(true);
  });
}); 