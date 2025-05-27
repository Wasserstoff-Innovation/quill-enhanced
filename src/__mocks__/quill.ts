import type { DeltaOperation } from '../core/types';

class Delta {
  ops: DeltaOperation[];

  constructor(ops: DeltaOperation[] = []) {
    this.ops = ops;
  }

  compose(other: Delta) {
    return new Delta([...this.ops, ...other.ops]);
  }

  concat(other: Delta) {
    return new Delta([...this.ops, ...other.ops]);
  }

  diff(_other: Delta) {
    // Simple mock implementation
    return new Delta([]);
  }

  eachLine(predicate: (delta: Delta, attributes: Record<string, any>) => void) {
    this.ops.forEach(op => {
      if (typeof op.insert === 'string' && op.insert.includes('\n')) {
        predicate(new Delta([op]), {});
      }
    });
  }

  filter(predicate: (op: DeltaOperation) => boolean) {
    return new Delta(this.ops.filter(predicate));
  }

  forEach(predicate: (op: DeltaOperation) => void) {
    this.ops.forEach(predicate);
  }

  insert(text: string, attributes?: Record<string, any>) {
    return new Delta([...this.ops, { insert: text, attributes }]);
  }

  length() {
    return this.ops.reduce((length, op) => {
      if (typeof op.insert === 'string') {
        return length + op.insert.length;
      }
      return length;
    }, 0);
  }

  map<T>(predicate: (op: DeltaOperation) => T) {
    return this.ops.map(predicate);
  }

  partition(predicate: (op: DeltaOperation) => boolean): [Delta, Delta] {
    const passed: DeltaOperation[] = [];
    const failed: DeltaOperation[] = [];
    this.ops.forEach(op => {
      if (predicate(op)) {
        passed.push(op);
      } else {
        failed.push(op);
      }
    });
    return [new Delta(passed), new Delta(failed)];
  }

  reduce<T>(predicate: (acc: T, op: DeltaOperation) => T, initialValue: T) {
    return this.ops.reduce(predicate, initialValue);
  }

  slice(start: number = 0, end: number = Infinity) {
    return new Delta(this.ops.slice(start, end));
  }

  transform(_other: Delta) {
    // Simple mock implementation  
    return new Delta([]);
  }

  transformPosition(index: number) {
    return index;
  }
}

class MockQuill {
  private element: HTMLElement;
  private content: Delta;
  private selection: { index: number; length: number } | null;
  private modules: Record<string, any>;
  private formats: Record<string, any>;
  private theme: string;
  private eventHandlers: Record<string, Function[]>;

  constructor(element: HTMLElement, options: any = {}) {
    this.element = element;
    this.content = new Delta();
    this.selection = null;
    this.modules = options.modules || {};
    this.formats = options.formats || {};
    this.theme = options.theme || 'snow';
    this.eventHandlers = {};

    // Initialize toolbar if snow theme is used
    if (this.theme === 'snow') {
      const toolbar = document.createElement('div');
      toolbar.className = 'ql-toolbar';
      this.element.insertBefore(toolbar, this.element.firstChild);
    }
  }

  on(event: string, handler: Function) {
    if (!this.eventHandlers[event]) {
      this.eventHandlers[event] = [];
    }
    this.eventHandlers[event].push(handler);
  }

  off(event: string, handler: Function) {
    if (this.eventHandlers[event]) {
      this.eventHandlers[event] = this.eventHandlers[event].filter(h => h !== handler);
    }
  }

  getContents() {
    return this.content;
  }

  setContents(delta: Delta) {
    this.content = delta;
    this.trigger('text-change', delta, this.content, 'user');
  }

  getText() {
    return this.content.ops.map(op => op.insert).join('');
  }

  setText(text: string) {
    this.setContents(new Delta([{ insert: text }]));
  }

  getSelection() {
    return this.selection;
  }

  setSelection(range: { index: number; length: number } | null) {
    this.selection = range;
    this.trigger('selection-change', range, null, 'user');
  }

  getFormat(_range?: { index: number; length: number }) {
    // Return mock formats
    return this.formats;
  }

  format(format: string, value: any) {
    this.formats[format] = value;
    this.trigger('format-change', format, value, 'user');
  }

  focus() {
    this.trigger('focus', null, null, 'user');
  }

  blur() {
    this.trigger('blur', null, null, 'user');
  }

  enable(enabled: boolean = true) {
    this.trigger('enable', enabled, null, 'user');
  }

  disable() {
    this.enable(false);
  }

  private trigger(event: string, ...args: any[]) {
    if (this.eventHandlers[event]) {
      this.eventHandlers[event].forEach(handler => handler(...args));
    }
  }

  static import(name: string) {
    if (name === 'delta') {
      return Delta;
    }
    return {};
  }
}

export default MockQuill; 