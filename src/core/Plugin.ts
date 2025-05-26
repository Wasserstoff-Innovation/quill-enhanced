import type { Plugin as IPlugin } from './types';

export abstract class Plugin implements IPlugin {
  protected editor: any;
  protected name: string;

  constructor(name: string) {
    this.name = name;
  }

  getName(): string {
    return this.name;
  }

  abstract init(editor: any): void;
  abstract destroy(): void;

  protected getEditor(): any {
    return this.editor;
  }

  protected setEditor(editor: any): void {
    this.editor = editor;
  }
} 