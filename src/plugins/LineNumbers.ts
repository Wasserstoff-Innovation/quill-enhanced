import Quill from 'quill';

const Delta = Quill.import('delta');

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
  private quill: any;
  private options: LineNumbersOptions;
  private container: HTMLElement;
  private numbers: HTMLElement[] = [];

  constructor(quill: any, options: LineNumbersOptions = {}) {
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
    this.container.style.cssText = `
      position: absolute;
      left: 0;
      top: 0;
      bottom: 0;
      width: 50px;
      border-right: 1px solid #ccc;
      background: #f8f8f8;
      overflow: hidden;
      pointer-events: none;
    `;

    if (this.options.enabled) {
      this.initialize();
    }
  }

  private initialize(): void {
    const editor = this.quill.root.parentElement;
    editor.style.position = 'relative';
    editor.style.paddingLeft = '50px';
    editor.appendChild(this.container);

    this.quill.on('text-change', () => this.update());
    this.quill.on('scroll', () => this.syncScroll());
    this.update();
  }

  private update(): void {
    const text = this.quill.getText();
    const lines = text.split('\n');
    const lineCount = lines.length;

    // Remove excess line numbers
    while (this.numbers.length > lineCount) {
      const number = this.numbers.pop();
      if (number) {
        this.container.removeChild(number);
      }
    }

    // Add new line numbers
    while (this.numbers.length < lineCount) {
      const number = document.createElement('div');
      number.style.cssText = `
        height: ${this.quill.root.style.lineHeight || '1.5em'};
        line-height: ${this.quill.root.style.lineHeight || '1.5em'};
        padding-right: ${this.options.style?.paddingRight || '10px'};
        text-align: ${this.options.style?.textAlign || 'right'};
        color: ${this.options.style?.color || '#999'};
        font-size: ${this.options.style?.fontSize || '14px'};
        font-family: ${this.options.style?.fontFamily || 'monospace'};
        user-select: ${this.options.style?.userSelect || 'none'};
      `;
      this.container.appendChild(number);
      this.numbers.push(number);
    }

    // Update line numbers
    this.numbers.forEach((number, index) => {
      number.textContent = String(this.options.startLine! + index);
    });
  }

  private syncScroll(): void {
    const editor = this.quill.root;
    this.numbers.forEach(number => {
      number.style.transform = `translateY(-${editor.scrollTop}px)`;
    });
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
    if (this.options.enabled) {
      this.options.enabled = false;
      this.container.remove();
      this.numbers = [];
    }
  }

  public destroy(): void {
    this.disable();
  }
} 