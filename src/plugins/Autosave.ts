import Quill from 'quill';

const Delta = Quill.import('delta');

export interface AutosaveOptions {
  enabled?: boolean;
  interval?: number;
  onSave?: (content: any) => void;
  onError?: (error: Error) => void;
}

export class AutosavePlugin {
  private quill: any;
  private options: AutosaveOptions;
  private timer: NodeJS.Timeout | null = null;
  private lastContent: any | null = null;

  constructor(quill: any, options: AutosaveOptions = {}) {
    this.quill = quill;
    this.options = {
      enabled: true,
      interval: 5000, // 5 seconds default
      ...options
    };

    if (this.options.enabled) {
      this.start();
    }
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
  }

  public save(): void {
    try {
      const content = this.quill.getContents();
      
      // Only save if content has changed
      if (!this.lastContent || !content.equals(this.lastContent)) {
        this.lastContent = content;
        this.options.onSave?.(content);
      }
    } catch (error) {
      this.options.onError?.(error instanceof Error ? error : new Error(String(error)));
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

  public destroy(): void {
    this.stop();
  }
} 