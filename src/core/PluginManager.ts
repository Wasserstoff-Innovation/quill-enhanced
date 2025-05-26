import type { Plugin } from './types';

export class PluginManager {
  private plugins: Map<string, Plugin> = new Map();
  private editor: any;

  constructor(editor: any) {
    this.editor = editor;
  }

  register(plugin: Plugin): void {
    const name = plugin.getName();
    if (this.plugins.has(name)) {
      throw new Error(`Plugin ${name} is already registered`);
    }
    plugin.init(this.editor);
    this.plugins.set(name, plugin);
  }

  unregister(name: string): void {
    const plugin = this.plugins.get(name);
    if (plugin) {
      plugin.destroy();
      this.plugins.delete(name);
    }
  }

  getPlugin(name: string): Plugin | undefined {
    return this.plugins.get(name);
  }

  hasPlugin(name: string): boolean {
    return this.plugins.has(name);
  }

  getAllPlugins(): Plugin[] {
    return Array.from(this.plugins.values());
  }

  destroy(): void {
    this.plugins.forEach(plugin => plugin.destroy());
    this.plugins.clear();
  }
} 