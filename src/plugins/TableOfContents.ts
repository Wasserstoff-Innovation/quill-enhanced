export interface TOCItem {
  id: string;
  level: number;
  text: string;
  index: number;
  element?: HTMLElement;
}

export interface TOCOptions {
  enabled?: boolean;
  selector?: string;
  levels?: number[];
  autoUpdate?: boolean;
  includeNumbers?: boolean;
  onTOCUpdate?: (items: TOCItem[]) => void;
  onItemClick?: (item: TOCItem) => void;
}

export class TableOfContentsPlugin {
  private quill: any;
  private options: Required<TOCOptions>;
  private tocItems: TOCItem[] = [];
  private observer: MutationObserver | null = null;
  private updateTimeout: NodeJS.Timeout | null = null;

  constructor(quill: any, options: TOCOptions = {}) {
    this.quill = quill;
    this.options = {
      enabled: true,
      selector: 'h1, h2, h3, h4, h5, h6',
      levels: [1, 2, 3, 4, 5, 6],
      autoUpdate: true,
      includeNumbers: true,
      onTOCUpdate: () => {},
      onItemClick: () => {},
      ...options
    };

    if (this.options.enabled) {
      this.initialize();
    }
  }

  private initialize(): void {
    this.setupEventListeners();
    this.generateTOC();
    
    if (this.options.autoUpdate) {
      this.setupAutoUpdate();
    }
  }

  private setupEventListeners(): void {
    // Listen for text changes to update TOC
    this.quill.on('text-change', () => {
      if (this.options.autoUpdate) {
        this.debouncedUpdate();
      }
    });

    // Listen for editor changes
    this.quill.on('editor-change', () => {
      if (this.options.autoUpdate) {
        this.debouncedUpdate();
      }
    });
  }

  private setupAutoUpdate(): void {
    // Use MutationObserver to watch for DOM changes
    if (typeof MutationObserver !== 'undefined') {
      this.observer = new MutationObserver(() => {
        this.debouncedUpdate();
      });

      this.observer.observe(this.quill.root, {
        childList: true,
        subtree: true,
        characterData: true
      });
    }
  }

  private debouncedUpdate(): void {
    if (this.updateTimeout) {
      clearTimeout(this.updateTimeout);
    }

    this.updateTimeout = setTimeout(() => {
      this.generateTOC();
    }, 300); // 300ms debounce
  }

  public generateTOC(): TOCItem[] {
    this.tocItems = [];
    const headings = this.findHeadings();
    
    headings.forEach((heading, index) => {
      const level = this.getHeadingLevel(heading);
      if (this.options.levels.includes(level)) {
        const id = this.generateId(heading, index);
        const text = this.extractText(heading);
        const quillIndex = this.getQuillIndex(heading);

        // Add ID to heading if it doesn't have one
        if (!heading.id) {
          heading.id = id;
        }

        const tocItem: TOCItem = {
          id,
          level,
          text,
          index: quillIndex,
          element: heading
        };

        this.tocItems.push(tocItem);
      }
    });

    this.options.onTOCUpdate(this.tocItems);
    return this.tocItems;
  }

  private findHeadings(): HTMLElement[] {
    const headings: HTMLElement[] = [];
    const elements = this.quill.root.querySelectorAll(this.options.selector);
    
    elements.forEach((element: HTMLElement) => {
      headings.push(element);
    });

    return headings;
  }

  private getHeadingLevel(element: HTMLElement): number {
    const tagName = element.tagName.toLowerCase();
    const match = tagName.match(/h(\d)/);
    return match ? parseInt(match[1], 10) : 1;
  }

  private generateId(element: HTMLElement, index: number): string {
    const text = this.extractText(element);
    const slug = text
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
      .trim();
    
    return slug || `heading-${index}`;
  }

  private extractText(element: HTMLElement): string {
    return element.textContent?.trim() || '';
  }

  private getQuillIndex(element: HTMLElement): number {
    try {
      // Find the position of this element in the Quill editor
      const range = document.createRange();
      range.selectNodeContents(element);
      
      // Get the Quill index for this range
      const selection = this.quill.getSelection();
      if (selection) {
        // This is a simplified approach - in practice, you might need
        // more sophisticated logic to map DOM elements to Quill indices
        return this.quill.getIndex(element) || 0;
      }
      return 0;
    } catch (error) {
      console.warn('Could not determine Quill index for heading:', error);
      return 0;
    }
  }

  public navigateToItem(item: TOCItem): void {
    try {
      if (item.element) {
        // Scroll to the element
        item.element.scrollIntoView({
          behavior: 'smooth',
          block: 'start'
        });

        // Set Quill selection to this position
        this.quill.setSelection(item.index, 0);
        
        // Focus the editor
        this.quill.focus();

        this.options.onItemClick(item);
      }
    } catch (error) {
      console.error('Error navigating to TOC item:', error);
    }
  }

  public insertTOC(format: 'list' | 'numbered' = 'list'): void {
    const tocHtml = this.generateTOCHTML(format);
    const selection = this.quill.getSelection();
    const index = selection ? selection.index : this.quill.getLength();

    // Insert the TOC at the current position
    this.quill.clipboard.dangerouslyPasteHTML(index, tocHtml);
  }

  private generateTOCHTML(format: 'list' | 'numbered'): string {
    if (this.tocItems.length === 0) {
      return '<p><em>No headings found</em></p>';
    }

    const listType = format === 'numbered' ? 'ol' : 'ul';
    let html = `<${listType} class="table-of-contents">`;

    this.tocItems.forEach((item, index) => {
      const indent = '  '.repeat(item.level - 1);
      const number = this.options.includeNumbers ? `${index + 1}. ` : '';
      
      html += `${indent}<li class="toc-level-${item.level}">`;
      html += `<a href="#${item.id}" class="toc-link" data-toc-id="${item.id}">`;
      html += `${number}${item.text}`;
      html += `</a></li>`;
    });

    html += `</${listType}>`;
    return html;
  }

  public getTOCItems(): TOCItem[] {
    return [...this.tocItems];
  }

  public findItemById(id: string): TOCItem | undefined {
    return this.tocItems.find(item => item.id === id);
  }

  public getItemsByLevel(level: number): TOCItem[] {
    return this.tocItems.filter(item => item.level === level);
  }

  public updateOptions(newOptions: Partial<TOCOptions>): void {
    this.options = { ...this.options, ...newOptions };
    
    if (this.options.enabled) {
      this.generateTOC();
    }
  }

  public enable(): void {
    this.options.enabled = true;
    this.initialize();
  }

  public disable(): void {
    this.options.enabled = false;
    this.destroy();
  }

  public refresh(): void {
    this.generateTOC();
  }

  public destroy(): void {
    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
    }

    if (this.updateTimeout) {
      clearTimeout(this.updateTimeout);
      this.updateTimeout = null;
    }

    // Remove event listeners
    this.quill.off('text-change');
    this.quill.off('editor-change');

    this.tocItems = [];
  }
}

// Export utility functions for external use
export const TOCUtils = {
  /**
   * Generate a simple TOC from Quill Delta
   */
  generateFromDelta(delta: any): TOCItem[] {
    const items: TOCItem[] = [];
    let index = 0;

    delta.ops.forEach((op: any) => {
      if (op.attributes && op.attributes.header) {
        const level = op.attributes.header;
        const text = typeof op.insert === 'string' ? op.insert.trim() : '';
        
        if (text) {
          items.push({
            id: `heading-${items.length}`,
            level,
            text,
            index
          });
        }
      }
      
      if (typeof op.insert === 'string') {
        index += op.insert.length;
      } else {
        index += 1; // For embeds
      }
    });

    return items;
  },

  /**
   * Create a nested TOC structure
   */
  createNestedStructure(items: TOCItem[]): any[] {
    const nested: any[] = [];
    const stack: any[] = [];

    items.forEach(item => {
      const tocItem = { ...item, children: [] };

      // Find the correct parent level
      while (stack.length > 0 && stack[stack.length - 1].level >= item.level) {
        stack.pop();
      }

      if (stack.length === 0) {
        nested.push(tocItem);
      } else {
        stack[stack.length - 1].children.push(tocItem);
      }

      stack.push(tocItem);
    });

    return nested;
  }
}; 