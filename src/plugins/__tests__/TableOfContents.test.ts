import { jest } from '@jest/globals';
import { TableOfContentsPlugin, TOCUtils, type TOCItem } from '../TableOfContents';

// Mock Quill
const mockQuill = {
  on: jest.fn(),
  off: jest.fn(),
  getSelection: jest.fn(),
  setSelection: jest.fn(),
  getLength: jest.fn(),
  focus: jest.fn(),
  getIndex: jest.fn(),
  clipboard: {
    dangerouslyPasteHTML: jest.fn()
  },
  root: {
    querySelectorAll: jest.fn(),
    innerHTML: ''
  }
};

// Mock DOM elements
const createMockElement = (tagName: string, textContent: string, id?: string): HTMLElement => {
  const element = {
    tagName: tagName.toUpperCase(),
    textContent,
    id: id || '',
    scrollIntoView: jest.fn()
  } as unknown as HTMLElement;
  
  return element;
};

// Mock MutationObserver
const mockMutationObserver = {
  observe: jest.fn(),
  disconnect: jest.fn()
};

Object.defineProperty(global, 'MutationObserver', {
  value: jest.fn().mockImplementation(() => mockMutationObserver),
  writable: true
});

// Mock document.createRange
Object.defineProperty(document, 'createRange', {
  value: jest.fn().mockImplementation(() => ({
    selectNodeContents: jest.fn()
  })),
  writable: true
});

describe('TableOfContentsPlugin', () => {
  let plugin: TableOfContentsPlugin;
  let onTOCUpdate: jest.Mock;
  let onItemClick: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    onTOCUpdate = jest.fn();
    onItemClick = jest.fn();
    
    // Setup default empty querySelectorAll result
    mockQuill.root.querySelectorAll.mockReturnValue([]);
    
    plugin = new TableOfContentsPlugin(mockQuill, {
      onTOCUpdate,
      onItemClick,
      autoUpdate: false // Disable auto-update for controlled testing
    });
  });

  afterEach(() => {
    plugin.destroy();
  });

  describe('initialization', () => {
    it('should initialize with default options', () => {
      const defaultPlugin = new TableOfContentsPlugin(mockQuill);
      
      expect(mockQuill.on).toHaveBeenCalledWith('text-change', expect.any(Function));
      expect(mockQuill.on).toHaveBeenCalledWith('editor-change', expect.any(Function));
      
      defaultPlugin.destroy();
    });

    it('should initialize with custom options', () => {
      const customPlugin = new TableOfContentsPlugin(mockQuill, {
        enabled: true,
        levels: [1, 2, 3],
        includeNumbers: false,
        autoUpdate: true
      });

      expect(customPlugin['options'].levels).toEqual([1, 2, 3]);
      expect(customPlugin['options'].includeNumbers).toBe(false);
      
      customPlugin.destroy();
    });

    it('should not initialize when disabled', () => {
      // Clear any previous calls
      jest.clearAllMocks();
      
      const disabledPlugin = new TableOfContentsPlugin(mockQuill, {
        enabled: false
      });

      // Should not set up event listeners when disabled
      expect(mockQuill.on).not.toHaveBeenCalled();
      
      disabledPlugin.destroy();
    });
  });

  describe('generateTOC', () => {
    beforeEach(() => {
      // Mock headings in the document
      const headings = [
        createMockElement('h1', 'Chapter 1'),
        createMockElement('h2', 'Section 1.1'),
        createMockElement('h2', 'Section 1.2'),
        createMockElement('h1', 'Chapter 2'),
        createMockElement('h3', 'Subsection 2.1.1')
      ];

      mockQuill.root.querySelectorAll.mockReturnValue(headings);
      mockQuill.getIndex.mockReturnValue(0);
    });

    it('should generate TOC from headings', () => {
      const tocItems = plugin.generateTOC();

      expect(tocItems).toHaveLength(5);
      expect(tocItems[0]).toMatchObject({
        level: 1,
        text: 'Chapter 1',
        id: 'chapter-1'
      });
      expect(tocItems[1]).toMatchObject({
        level: 2,
        text: 'Section 1.1',
        id: 'section-11'
      });
      expect(onTOCUpdate).toHaveBeenCalledWith(tocItems);
    });

    it('should filter headings by level', () => {
      plugin.updateOptions({ levels: [1, 2] });
      const tocItems = plugin.generateTOC();

      expect(tocItems).toHaveLength(4); // Should exclude h3
      expect(tocItems.every(item => [1, 2].includes(item.level))).toBe(true);
    });

    it('should generate unique IDs for headings', () => {
      const headings = [
        createMockElement('h1', 'Introduction'),
        createMockElement('h1', 'Introduction'), // Duplicate
        createMockElement('h1', 'Special @#$ Characters!')
      ];

      mockQuill.root.querySelectorAll.mockReturnValue(headings);
      const tocItems = plugin.generateTOC();

      expect(tocItems[0].id).toBe('introduction');
      expect(tocItems[1].id).toBe('introduction'); // Should handle duplicates
      expect(tocItems[2].id).toBe('special-characters');
    });

    it('should handle empty headings', () => {
      const headings = [
        createMockElement('h1', ''),
        createMockElement('h2', '   '), // Whitespace only
        createMockElement('h1', 'Valid Heading')
      ];

      mockQuill.root.querySelectorAll.mockReturnValue(headings);
      const tocItems = plugin.generateTOC();

      expect(tocItems).toHaveLength(3);
      expect(tocItems[0].text).toBe('');
      expect(tocItems[1].text).toBe('');
      expect(tocItems[2].text).toBe('Valid Heading');
    });
  });

  describe('navigation', () => {
    it('should navigate to TOC item', () => {
      const mockElement = createMockElement('h1', 'Test Heading');
      const tocItem: TOCItem = {
        id: 'test-heading',
        level: 1,
        text: 'Test Heading',
        index: 10,
        element: mockElement
      };

      plugin.navigateToItem(tocItem);

      expect(mockElement.scrollIntoView).toHaveBeenCalledWith({
        behavior: 'smooth',
        block: 'start'
      });
      expect(mockQuill.setSelection).toHaveBeenCalledWith(10, 0);
      expect(mockQuill.focus).toHaveBeenCalled();
      expect(onItemClick).toHaveBeenCalledWith(tocItem);
    });

    it('should handle navigation errors gracefully', () => {
      const tocItem: TOCItem = {
        id: 'test-heading',
        level: 1,
        text: 'Test Heading',
        index: 10,
        element: undefined // No element
      };

      // Should not throw
      expect(() => plugin.navigateToItem(tocItem)).not.toThrow();
    });
  });

  describe('TOC insertion', () => {
    beforeEach(() => {
      plugin['tocItems'] = [
        {
          id: 'chapter-1',
          level: 1,
          text: 'Chapter 1',
          index: 0
        },
        {
          id: 'section-11',
          level: 2,
          text: 'Section 1.1',
          index: 20
        }
      ];

      mockQuill.getSelection.mockReturnValue({ index: 0, length: 0 });
      mockQuill.getLength.mockReturnValue(100);
    });

    it('should insert TOC as unordered list', () => {
      plugin.insertTOC('list');

      expect(mockQuill.clipboard.dangerouslyPasteHTML).toHaveBeenCalledWith(
        0,
        expect.stringContaining('<ul class="table-of-contents">')
      );
      expect(mockQuill.clipboard.dangerouslyPasteHTML).toHaveBeenCalledWith(
        0,
        expect.stringContaining('Chapter 1')
      );
    });

    it('should insert TOC as ordered list', () => {
      plugin.insertTOC('numbered');

      expect(mockQuill.clipboard.dangerouslyPasteHTML).toHaveBeenCalledWith(
        0,
        expect.stringContaining('<ol class="table-of-contents">')
      );
    });

    it('should include numbers when enabled', () => {
      // Setup headings for this test
      const headings = [
        createMockElement('h1', 'Chapter 1'),
        createMockElement('h2', 'Section 1.1')
      ];
      mockQuill.root.querySelectorAll.mockReturnValue(headings);
      
      // Generate TOC items from the headings
      plugin.generateTOC();
      
      plugin.updateOptions({ includeNumbers: true });
      plugin.insertTOC('list');

      const htmlCall = mockQuill.clipboard.dangerouslyPasteHTML.mock.calls[0][1];
      expect(htmlCall).toContain('1. Chapter 1');
      expect(htmlCall).toContain('2. Section 1.1');
    });

    it('should handle empty TOC', () => {
      plugin['tocItems'] = [];
      plugin.insertTOC();

      expect(mockQuill.clipboard.dangerouslyPasteHTML).toHaveBeenCalledWith(
        0,
        '<p><em>No headings found</em></p>'
      );
    });

    it('should insert at current selection', () => {
      mockQuill.getSelection.mockReturnValue({ index: 50, length: 5 });
      plugin.insertTOC();

      expect(mockQuill.clipboard.dangerouslyPasteHTML).toHaveBeenCalledWith(
        50,
        expect.any(String)
      );
    });

    it('should insert at end if no selection', () => {
      mockQuill.getSelection.mockReturnValue(null);
      plugin.insertTOC();

      expect(mockQuill.clipboard.dangerouslyPasteHTML).toHaveBeenCalledWith(
        100,
        expect.any(String)
      );
    });
  });

  describe('utility methods', () => {
    beforeEach(() => {
      plugin['tocItems'] = [
        { id: 'h1', level: 1, text: 'Heading 1', index: 0 },
        { id: 'h2', level: 2, text: 'Heading 2', index: 10 },
        { id: 'h3', level: 1, text: 'Heading 3', index: 20 }
      ];
    });

    it('should get all TOC items', () => {
      const items = plugin.getTOCItems();
      
      expect(items).toHaveLength(3);
      expect(items).not.toBe(plugin['tocItems']); // Should return a copy
    });

    it('should find item by ID', () => {
      const item = plugin.findItemById('h2');
      
      expect(item).toMatchObject({
        id: 'h2',
        level: 2,
        text: 'Heading 2'
      });
    });

    it('should return undefined for non-existent ID', () => {
      const item = plugin.findItemById('non-existent');
      
      expect(item).toBeUndefined();
    });

    it('should get items by level', () => {
      const level1Items = plugin.getItemsByLevel(1);
      
      expect(level1Items).toHaveLength(2);
      expect(level1Items.every(item => item.level === 1)).toBe(true);
    });
  });

  describe('auto-update functionality', () => {
    it('should setup auto-update when enabled', () => {
      const autoUpdatePlugin = new TableOfContentsPlugin(mockQuill, {
        autoUpdate: true
      });

      expect(MutationObserver).toHaveBeenCalled();
      expect(mockMutationObserver.observe).toHaveBeenCalledWith(
        mockQuill.root,
        {
          childList: true,
          subtree: true,
          characterData: true
        }
      );

      autoUpdatePlugin.destroy();
    });

    it('should debounce updates', (done) => {
      const autoUpdatePlugin = new TableOfContentsPlugin(mockQuill, {
        autoUpdate: true
      });

      const generateTOCSpy = jest.spyOn(autoUpdatePlugin, 'generateTOC');

      // Trigger multiple updates quickly
      autoUpdatePlugin['debouncedUpdate']();
      autoUpdatePlugin['debouncedUpdate']();
      autoUpdatePlugin['debouncedUpdate']();

      // Should only call generateTOC once after debounce
      setTimeout(() => {
        expect(generateTOCSpy).toHaveBeenCalledTimes(1);
        autoUpdatePlugin.destroy();
        done();
      }, 350); // Wait longer than debounce delay
    });
  });

  describe('enable/disable functionality', () => {
    it('should enable plugin', () => {
      plugin.disable();
      plugin.enable();

      expect(plugin['options'].enabled).toBe(true);
    });

    it('should disable plugin', () => {
      plugin.disable();

      expect(plugin['options'].enabled).toBe(false);
    });

    it('should refresh TOC', () => {
      const generateTOCSpy = jest.spyOn(plugin, 'generateTOC');
      
      plugin.refresh();

      expect(generateTOCSpy).toHaveBeenCalled();
    });
  });

  describe('cleanup', () => {
    it('should cleanup on destroy', () => {
      const autoUpdatePlugin = new TableOfContentsPlugin(mockQuill, {
        autoUpdate: true
      });

      autoUpdatePlugin.destroy();

      expect(mockMutationObserver.disconnect).toHaveBeenCalled();
      expect(mockQuill.off).toHaveBeenCalledWith('text-change');
      expect(mockQuill.off).toHaveBeenCalledWith('editor-change');
    });
  });
});

describe('TOCUtils', () => {
  describe('generateFromDelta', () => {
    it('should generate TOC from Delta operations', () => {
      const delta = {
        ops: [
          { insert: 'Chapter 1', attributes: { header: 1 } },
          { insert: '\n' },
          { insert: 'Some content here' },
          { insert: '\n' },
          { insert: 'Section 1.1', attributes: { header: 2 } },
          { insert: '\n' },
          { insert: 'More content' },
          { insert: '\n' }
        ]
      };

      const tocItems = TOCUtils.generateFromDelta(delta);

      expect(tocItems).toHaveLength(2);
      expect(tocItems[0]).toMatchObject({
        level: 1,
        text: 'Chapter 1',
        id: 'heading-0'
      });
      expect(tocItems[1]).toMatchObject({
        level: 2,
        text: 'Section 1.1',
        id: 'heading-1'
      });
    });

    it('should handle empty or invalid delta', () => {
      const emptyDelta = { ops: [] };
      const tocItems = TOCUtils.generateFromDelta(emptyDelta);

      expect(tocItems).toHaveLength(0);
    });

    it('should skip non-text inserts', () => {
      const delta = {
        ops: [
          { insert: 'Heading', attributes: { header: 1 } },
          { insert: { image: 'image.jpg' } }, // Non-text insert
          { insert: '\n' }
        ]
      };

      const tocItems = TOCUtils.generateFromDelta(delta);

      expect(tocItems).toHaveLength(1);
      expect(tocItems[0].index).toBe(0);
    });
  });

  describe('createNestedStructure', () => {
    it('should create nested structure from flat TOC items', () => {
      const flatItems: TOCItem[] = [
        { id: 'h1', level: 1, text: 'Chapter 1', index: 0 },
        { id: 'h2', level: 2, text: 'Section 1.1', index: 10 },
        { id: 'h3', level: 2, text: 'Section 1.2', index: 20 },
        { id: 'h4', level: 3, text: 'Subsection 1.2.1', index: 30 },
        { id: 'h5', level: 1, text: 'Chapter 2', index: 40 }
      ];

      const nested = TOCUtils.createNestedStructure(flatItems);

      expect(nested).toHaveLength(2); // Two top-level chapters
      expect(nested[0].text).toBe('Chapter 1');
      expect(nested[0].children).toHaveLength(2); // Two sections
      expect(nested[0].children[1].children).toHaveLength(1); // One subsection
      expect(nested[1].text).toBe('Chapter 2');
      expect(nested[1].children).toHaveLength(0);
    });

    it('should handle empty items array', () => {
      const nested = TOCUtils.createNestedStructure([]);

      expect(nested).toHaveLength(0);
    });

    it('should handle items with same level', () => {
      const flatItems: TOCItem[] = [
        { id: 'h1', level: 1, text: 'Heading 1', index: 0 },
        { id: 'h2', level: 1, text: 'Heading 2', index: 10 },
        { id: 'h3', level: 1, text: 'Heading 3', index: 20 }
      ];

      const nested = TOCUtils.createNestedStructure(flatItems);

      expect(nested).toHaveLength(3);
      expect(nested.every(item => item.children.length === 0)).toBe(true);
    });
  });
}); 