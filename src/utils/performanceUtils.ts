export interface PerformanceMetrics {
  renderTime: number;
  memoryUsage: number;
  documentSize: number;
  operationCount: number;
  lastUpdate: number;
}

export interface PerformanceOptions {
  enableProfiling?: boolean;
  maxOperationsPerSecond?: number;
  memoryThreshold?: number; // in MB
  documentSizeThreshold?: number; // in characters
  debounceDelay?: number;
  throttleDelay?: number;
}

export class PerformanceMonitor {
  private metrics: PerformanceMetrics = {
    renderTime: 0,
    memoryUsage: 0,
    documentSize: 0,
    operationCount: 0,
    lastUpdate: Date.now()
  };

  private options: Required<PerformanceOptions>;
  private operationQueue: Array<() => void> = [];
  private isProcessing = false;
  private observers: Array<(metrics: PerformanceMetrics) => void> = [];

  constructor(options: PerformanceOptions = {}) {
    this.options = {
      enableProfiling: true,
      maxOperationsPerSecond: 60,
      memoryThreshold: 100, // 100MB
      documentSizeThreshold: 1000000, // 1M characters
      debounceDelay: 100,
      throttleDelay: 16, // ~60fps
      ...options
    };
  }

  /**
   * Start performance monitoring
   */
  startProfiling(): void {
    if (!this.options.enableProfiling) return;

    // Monitor memory usage periodically
    setInterval(() => {
      this.updateMemoryUsage();
    }, 5000);
  }

  /**
   * Measure execution time of a function
   */
  measureTime<T>(fn: () => T, label?: string): T {
    if (!this.options.enableProfiling) return fn();

    const start = performance.now();
    const result = fn();
    const end = performance.now();
    
    this.metrics.renderTime = end - start;
    this.metrics.lastUpdate = Date.now();
    
    if (label) {
      console.log(`Performance: ${label} took ${end - start}ms`);
    }
    
    this.notifyObservers();
    return result;
  }

  /**
   * Measure async execution time
   */
  async measureTimeAsync<T>(fn: () => Promise<T>, label?: string): Promise<T> {
    if (!this.options.enableProfiling) return fn();

    const start = performance.now();
    const result = await fn();
    const end = performance.now();
    
    this.metrics.renderTime = end - start;
    this.metrics.lastUpdate = Date.now();
    
    if (label) {
      console.log(`Performance: ${label} took ${end - start}ms`);
    }
    
    this.notifyObservers();
    return result;
  }

  /**
   * Queue operation for batch processing
   */
  queueOperation(operation: () => void): void {
    this.operationQueue.push(operation);
    this.metrics.operationCount++;
    
    if (!this.isProcessing) {
      this.processQueue();
    }
  }

  /**
   * Process queued operations
   */
  private async processQueue(): Promise<void> {
    if (this.isProcessing || this.operationQueue.length === 0) return;
    
    this.isProcessing = true;
    const maxOpsPerFrame = Math.ceil(this.options.maxOperationsPerSecond / 60);
    
    while (this.operationQueue.length > 0) {
      const batch = this.operationQueue.splice(0, maxOpsPerFrame);
      
      await this.measureTimeAsync(async () => {
        batch.forEach(op => op());
      }, `Batch processing ${batch.length} operations`);
      
      // Yield to browser
      await new Promise(resolve => setTimeout(resolve, 0));
    }
    
    this.isProcessing = false;
  }

  /**
   * Update memory usage metrics
   */
  private updateMemoryUsage(): void {
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      this.metrics.memoryUsage = memory.usedJSHeapSize / (1024 * 1024); // Convert to MB
      
      if (this.metrics.memoryUsage > this.options.memoryThreshold) {
        console.warn(`Memory usage high: ${this.metrics.memoryUsage.toFixed(2)}MB`);
        this.triggerGarbageCollection();
      }
    }
  }

  /**
   * Update document size metrics
   */
  updateDocumentSize(size: number): void {
    this.metrics.documentSize = size;
    
    if (size > this.options.documentSizeThreshold) {
      console.warn(`Document size large: ${size} characters`);
    }
    
    this.notifyObservers();
  }

  /**
   * Trigger garbage collection (if available)
   */
  private triggerGarbageCollection(): void {
    if ('gc' in window && typeof (window as any).gc === 'function') {
      (window as any).gc();
    }
  }

  /**
   * Get current metrics
   */
  getMetrics(): PerformanceMetrics {
    return { ...this.metrics };
  }

  /**
   * Subscribe to metrics updates
   */
  subscribe(observer: (metrics: PerformanceMetrics) => void): () => void {
    this.observers.push(observer);
    
    return () => {
      const index = this.observers.indexOf(observer);
      if (index > -1) {
        this.observers.splice(index, 1);
      }
    };
  }

  /**
   * Notify observers of metrics changes
   */
  private notifyObservers(): void {
    this.observers.forEach(observer => observer(this.metrics));
  }

  /**
   * Reset metrics
   */
  reset(): void {
    this.metrics = {
      renderTime: 0,
      memoryUsage: 0,
      documentSize: 0,
      operationCount: 0,
      lastUpdate: Date.now()
    };
    this.notifyObservers();
  }
}

/**
 * Debounce function calls
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: NodeJS.Timeout;
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
}

/**
 * Throttle function calls
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  delay: number
): (...args: Parameters<T>) => void {
  let lastCall = 0;
  
  return (...args: Parameters<T>) => {
    const now = Date.now();
    if (now - lastCall >= delay) {
      lastCall = now;
      func(...args);
    }
  };
}

/**
 * Request animation frame wrapper
 */
export function requestAnimationFrameThrottle<T extends (...args: any[]) => any>(
  func: T
): (...args: Parameters<T>) => void {
  let rafId: number | null = null;
  
  return (...args: Parameters<T>) => {
    if (rafId !== null) return;
    
    rafId = requestAnimationFrame(() => {
      func(...args);
      rafId = null;
    });
  };
}

/**
 * Batch DOM operations
 */
export class DOMBatcher {
  private readOperations: Array<() => void> = [];
  private writeOperations: Array<() => void> = [];
  private isScheduled = false;

  /**
   * Queue a DOM read operation
   */
  read(operation: () => void): void {
    this.readOperations.push(operation);
    this.schedule();
  }

  /**
   * Queue a DOM write operation
   */
  write(operation: () => void): void {
    this.writeOperations.push(operation);
    this.schedule();
  }

  /**
   * Schedule batch execution
   */
  private schedule(): void {
    if (this.isScheduled) return;
    
    this.isScheduled = true;
    requestAnimationFrame(() => {
      this.flush();
    });
  }

  /**
   * Execute all queued operations
   */
  private flush(): void {
    // Execute all reads first
    while (this.readOperations.length > 0) {
      const operation = this.readOperations.shift();
      if (operation) operation();
    }
    
    // Then execute all writes
    while (this.writeOperations.length > 0) {
      const operation = this.writeOperations.shift();
      if (operation) operation();
    }
    
    this.isScheduled = false;
  }
}

/**
 * Virtual scrolling helper for large documents
 */
export class VirtualScroller {
  private container: HTMLElement;
  private itemHeight: number;
  private visibleCount: number;
  private totalCount: number;
  private scrollTop = 0;
  private renderCallback: (startIndex: number, endIndex: number) => void;

  constructor(
    container: HTMLElement,
    itemHeight: number,
    visibleCount: number,
    renderCallback: (startIndex: number, endIndex: number) => void
  ) {
    this.container = container;
    this.itemHeight = itemHeight;
    this.visibleCount = visibleCount;
    this.totalCount = 0;
    this.renderCallback = renderCallback;
    
    this.setupScrollListener();
  }

  /**
   * Set total item count
   */
  setTotalCount(count: number): void {
    this.totalCount = count;
    this.updateScrollHeight();
    this.render();
  }

  /**
   * Setup scroll event listener
   */
  private setupScrollListener(): void {
    const throttledScroll = throttle(() => {
      this.scrollTop = this.container.scrollTop;
      this.render();
    }, 16);
    
    this.container.addEventListener('scroll', throttledScroll);
  }

  /**
   * Update container scroll height
   */
  private updateScrollHeight(): void {
    this.container.style.height = `${this.totalCount * this.itemHeight}px`;
  }

  /**
   * Render visible items
   */
  private render(): void {
    const startIndex = Math.floor(this.scrollTop / this.itemHeight);
    const endIndex = Math.min(
      startIndex + this.visibleCount,
      this.totalCount
    );
    
    this.renderCallback(startIndex, endIndex);
  }
}

/**
 * Memory pool for object reuse
 */
export class ObjectPool<T> {
  private pool: T[] = [];
  private createFn: () => T;
  private resetFn?: (obj: T) => void;

  constructor(createFn: () => T, resetFn?: (obj: T) => void) {
    this.createFn = createFn;
    this.resetFn = resetFn;
  }

  /**
   * Get object from pool or create new one
   */
  get(): T {
    if (this.pool.length > 0) {
      return this.pool.pop()!;
    }
    return this.createFn();
  }

  /**
   * Return object to pool
   */
  release(obj: T): void {
    if (this.resetFn) {
      this.resetFn(obj);
    }
    this.pool.push(obj);
  }

  /**
   * Clear the pool
   */
  clear(): void {
    this.pool.length = 0;
  }

  /**
   * Get pool size
   */
  size(): number {
    return this.pool.length;
  }
}

/**
 * Event listener manager with automatic cleanup
 */
export class EventManager {
  private listeners: Array<{
    element: EventTarget;
    event: string;
    handler: EventListener;
    options?: AddEventListenerOptions;
  }> = [];

  /**
   * Add event listener
   */
  addEventListener(
    element: EventTarget,
    event: string,
    handler: EventListener,
    options?: AddEventListenerOptions
  ): void {
    element.addEventListener(event, handler, options);
    this.listeners.push({ element, event, handler, options });
  }

  /**
   * Remove specific event listener
   */
  removeEventListener(
    element: EventTarget,
    event: string,
    handler: EventListener
  ): void {
    element.removeEventListener(event, handler);
    
    const index = this.listeners.findIndex(
      listener => 
        listener.element === element &&
        listener.event === event &&
        listener.handler === handler
    );
    
    if (index > -1) {
      this.listeners.splice(index, 1);
    }
  }

  /**
   * Remove all event listeners
   */
  removeAllListeners(): void {
    this.listeners.forEach(({ element, event, handler }) => {
      element.removeEventListener(event, handler);
    });
    this.listeners.length = 0;
  }

  /**
   * Get listener count
   */
  getListenerCount(): number {
    return this.listeners.length;
  }
}

/**
 * Performance optimization utilities
 */
export const PerformanceUtils = {
  /**
   * Check if document is large
   */
  isLargeDocument(size: number, threshold = 100000): boolean {
    return size > threshold;
  },

  /**
   * Get optimal chunk size for processing
   */
  getOptimalChunkSize(totalSize: number, maxChunkSize = 1000): number {
    if (totalSize <= maxChunkSize) return totalSize;
    
    const chunks = Math.ceil(totalSize / maxChunkSize);
    return Math.ceil(totalSize / chunks);
  },

  /**
   * Process array in chunks
   */
  async processInChunks<T>(
    array: T[],
    processor: (chunk: T[]) => void | Promise<void>,
    chunkSize = 100
  ): Promise<void> {
    for (let i = 0; i < array.length; i += chunkSize) {
      const chunk = array.slice(i, i + chunkSize);
      await processor(chunk);
      
      // Yield to browser
      await new Promise(resolve => setTimeout(resolve, 0));
    }
  },

  /**
   * Optimize images for performance
   */
  optimizeImage(
    img: HTMLImageElement,
    maxWidth = 800,
    quality = 0.8
  ): Promise<string> {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d')!;
      
      const ratio = Math.min(maxWidth / img.width, maxWidth / img.height);
      canvas.width = img.width * ratio;
      canvas.height = img.height * ratio;
      
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      
      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(URL.createObjectURL(blob));
          }
        },
        'image/jpeg',
        quality
      );
    });
  }
};

// Global performance monitor instance
export const globalPerformanceMonitor = new PerformanceMonitor(); 