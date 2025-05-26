import { jest } from '@jest/globals';
import { Quill } from 'quill';
import { TrackChanges } from '../TrackChanges';

interface Change {
  id: string;
  type: 'insert' | 'delete' | 'format';
  text?: string;
  length?: number;
  attributes?: any;
  author: string;
  timestamp: number;
  accepted?: boolean;
  rejected?: boolean;
}

interface TrackChangesOptions {
  currentUser: string;
  enabled?: boolean;
}

jest.mock('quill');

describe('TrackChanges Plugin', () => {
  let quill: jest.Mocked<Quill>;
  let plugin: TrackChanges;
  let options: TrackChangesOptions;

  beforeEach(() => {
    quill = {
      on: jest.fn(),
      off: jest.fn(),
      getContents: jest.fn(),
      setContents: jest.fn(),
      getText: jest.fn(),
      setText: jest.fn(),
      getSelection: jest.fn(),
      setSelection: jest.fn(),
      getFormat: jest.fn(),
      format: jest.fn(),
      focus: jest.fn(),
      blur: jest.fn(),
      enable: jest.fn(),
      disable: jest.fn(),
      isEnabled: jest.fn().mockReturnValue(true),
      root: { innerHTML: '' }
    } as any;

    options = {
      currentUser: 'test-user',
      enabled: true
    };

    plugin = new TrackChanges(quill, options);
  });

  describe('Initialization', () => {
    it('should initialize with default options', () => {
      const defaultPlugin = new TrackChanges(quill, { currentUser: 'test-user' });
      expect(defaultPlugin.isEnabled()).toBe(true);
      expect(quill.on).toHaveBeenCalledWith('text-change', expect.any(Function));
    });

    it('should initialize with custom options', () => {
      const customOptions: TrackChangesOptions = {
        currentUser: 'custom-user',
        enabled: false
      };
      const customPlugin = new TrackChanges(quill, customOptions);
      expect(customPlugin.isEnabled()).toBe(false);
      // Plugin sets up event handlers during initialization regardless of enabled state
      expect(quill.on).toHaveBeenCalled();
    });
  });

  describe('Change Tracking', () => {
    it('should track text insertions', () => {
      const delta = { ops: [{ insert: 'test' }] };
      plugin.handleTextChange(delta);
      const changes = plugin.getChanges();
      expect(changes).toHaveLength(1);
      expect(changes[0]).toMatchObject({
        type: 'insert',
        text: 'test',
        author: 'test-user'
      });
    });

    it('should track text deletions', () => {
      const delta = { ops: [{ delete: 4 }] };
      plugin.handleTextChange(delta);
      const changes = plugin.getChanges();
      expect(changes).toHaveLength(1);
      expect(changes[0]).toMatchObject({
        type: 'delete',
        length: 4,
        author: 'test-user'
      });
    });

    it('should track formatting changes', () => {
      const delta = { ops: [{ attributes: { bold: true } }] };
      plugin.handleTextChange(delta);
      const changes = plugin.getChanges();
      expect(changes).toHaveLength(1);
      expect(changes[0]).toMatchObject({
        type: 'format',
        attributes: { bold: true },
        author: 'test-user'
      });
    });
  });

  describe('Change Management', () => {
    beforeEach(() => {
      const delta = { ops: [{ insert: 'test' }] };
      plugin.handleTextChange(delta);
    });

    it('should accept changes', () => {
      const changes = plugin.getChanges();
      const result = plugin.acceptChange(changes[0].id);
      expect(result).toBe(true);
      expect(changes[0].accepted).toBe(true);
    });

    it('should reject changes', () => {
      const changes = plugin.getChanges();
      const result = plugin.rejectChange(changes[0].id);
      expect(result).toBe(true);
      expect(changes[0].rejected).toBe(true);
    });

    it('should clear changes', () => {
      plugin.clearChanges();
      expect(plugin.getChanges()).toHaveLength(0);
    });
  });

  describe('Plugin State', () => {
    it('should enable tracking', () => {
      plugin.disable();
      plugin.enable();
      expect(plugin.isEnabled()).toBe(true);
      expect(quill.on).toHaveBeenCalledWith('text-change', expect.any(Function));
    });

    it('should disable tracking', () => {
      plugin.disable();
      expect(plugin.isEnabled()).toBe(false);
      expect(quill.off).toHaveBeenCalledWith('text-change', expect.any(Function));
    });

    it('should update options', () => {
      const newOptions = { currentUser: 'new-user' };
      plugin.updateOptions(newOptions);
      expect(plugin.getOptions().currentUser).toBe('new-user');
    });
  });
}); 