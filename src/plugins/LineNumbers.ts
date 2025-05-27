import Quill from 'quill';

export interface LineNumbersOptions {
  enabled?: boolean;
  startLine?: number;
  style?: {
    color?: string;
    fontSize?: string;
    fontFamily?: string;
    paddingRight?: string;
    textAlign?: string;
    userSelect?: string;
  };
}

export class LineNumbersPlugin {
  private quill: Quill;
  private options: LineNumbersOptions;
  private container: HTMLElement;
  private numbers: HTMLElement[] = [];
  private isInitialized: boolean = false;

  constructor(quill: Quill, options: LineNumbersOptions = {}) {
    this.quill = quill;
    this.options = {
      enabled: true,
      startLine: 1,
      style: {
        color: '#999',
        fontSize: '14px',
        fontFamily: 'monospace',
        paddingRight: '10px',
        textAlign: 'right',
        userSelect: 'none'
      },
      ...options
    };

    this.container = document.createElement('div');
    this.container.className = 'ql-line-numbers';
    
    if (this.options.enabled) {
      this.initialize();
    }
  }

  private initialize(): void {
    if (this.isInitialized) return;
    
    const editor = this.quill.container;
    if (!editor) return;

    // Remove any existing line number containers
    const existing = editor.querySelector('.ql-line-numbers');
    if (existing) existing.remove();

    // Style the container
    this.container.style.cssText = `
      position: absolute;
      left: 0;
      top: 0;
      bottom: 0;
      width: 40px;
      border-right: 1px solid #e0e0e0;
      background: #f8f8f8;
      overflow: hidden;
      pointer-events: none;
      z-index: 1;
    `;

    // Make editor container relative and add padding
    editor.style.position = 'relative';
    editor.style.paddingLeft = '40px';
    
    // Insert the line numbers container
    editor.insertBefore(this.container, this.quill.root);

    // Set up event listeners
    this.quill.on('text-change', () => this.update());
    this.quill.on('scroll', () => this.syncScroll());
    
    this.isInitialized = true;
    this.update();
  }

  private update(): void {
    if (!this.isInitialized) return;
    
    const text = this.quill.getText();
    const lines = text.split('\n');
    const lineCount = Math.max(lines.length - 1, 1); // Subtract 1 because Quill adds extra newline

    // Clear existing numbers
    this.container.innerHTML = '';
    this.numbers = [];

    // Add line numbers only for non-list lines
    const quillLines = this.quill.getLines();
    for (let i = 0, visualLine = 0; i < lineCount; i++) {
      const lineBlot = quillLines[i];
      let isList = false;
      if (lineBlot && lineBlot.formats) {
        const formats = lineBlot.formats();
        isList = !!formats.list;
      }
      if (!isList) {
        const number = document.createElement('div');
        number.className = 'ql-line-number-plugin';
        number.style.cssText = `
          height: 1.42em;
          line-height: 1.42em;
          padding-right: ${this.options.style?.paddingRight || '10px'};
          text-align: ${this.options.style?.textAlign || 'right'};
          color: ${this.options.style?.color || '#999'};
          font-size: ${this.options.style?.fontSize || '14px'};
          font-family: ${this.options.style?.fontFamily || 'monospace'};
          user-select: ${this.options.style?.userSelect || 'none'};
          box-sizing: border-box;
        `;
        number.textContent = String(this.options.startLine! + visualLine);
        this.container.appendChild(number);
        this.numbers.push(number);
        visualLine++;
      }
    }
  }

  private syncScroll(): void {
    if (!this.isInitialized) return;
    
    const editor = this.quill.root;
    this.container.scrollTop = editor.scrollTop;
  }

  public getLineNumbers(): HTMLElement[] {
    return this.numbers;
  }

  public setStyle(style: Partial<LineNumbersOptions['style']>): void {
    this.options.style = { ...this.options.style, ...style };
    this.update();
  }

  public setStartLine(startLine: number): void {
    this.options.startLine = startLine;
    this.update();
  }

  public enable(): void {
    if (!this.options.enabled) {
      this.options.enabled = true;
      this.initialize();
    }
  }

  public disable(): void {
    if (this.options.enabled && this.isInitialized) {
      this.options.enabled = false;
      
      // Remove padding and container
      const editor = this.quill.container;
      if (editor) {
        editor.style.paddingLeft = '';
        if (this.container.parentNode) {
          this.container.parentNode.removeChild(this.container);
        }
      }
      
      // Remove event listeners
      this.quill.off('text-change');
      this.quill.off('scroll');
      
      this.numbers = [];
      this.isInitialized = false;
    }
  }

  public destroy(): void {
    this.disable();
  }
} 