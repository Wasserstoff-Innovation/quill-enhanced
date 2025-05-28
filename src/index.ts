// Core
export { Editor as CoreEditor } from './core/Editor';
export { PluginManager } from './core/PluginManager';
export type { Plugin, EditorConfig, EditorChangeEvent } from './core/types';

// Components
export { default as Editor } from './components/Editor';
export type { EditorRef } from './components/Editor';
export { Toolbar } from './components/Toolbar';
export { DiffViewer } from './components/DiffViewer';
export { MarkdownPreview } from './components/MarkdownPreview';

// Plugins
export { TrackChanges as TrackChangesPlugin } from './plugins/TrackChanges';
export { MarkdownPlugin } from './plugins/MarkdownPlugin';
export { AutosavePlugin } from './plugins/Autosave';
export { LineNumbersPlugin } from './plugins/LineNumbers';

// Utilities
export {
  createDelta,
  createEmptyDelta,
  createTextDelta,
  createLineDelta,
  createHeadingDelta,
  createListDelta,
  createBlockquoteDelta,
  createCodeBlockDelta,
  mergeDeltas
} from './utils/delta';

export {
  toMarkdown,
  fromMarkdown,
  sanitizeMarkdown,
  deltaToHtml,
  htmlToDelta,
  markdownToHtml,
  deltaToMarkdown,
  createMarkdownPreview
} from './utils/markdownUtils';

export {
  exportToPDF,
  exportToDocx,
  exportToWord,
  exportToHTML,
  exportToMarkdown,
  deltaToText,
  deltaToHtml as exportDeltaToHtml
} from './utils/exportUtils';

export {
  getDiff,
  applyDiff,
  formatDiff,
  computeDiff,
  applyDiffHighlighting,
  createUnifiedDiff,
  createSplitDiffs,
  deltaToText as diffDeltaToText
} from './utils/diffUtils';

// Types
export type { DeltaOperation } from './types/delta';

// Constants
export { EDITOR_MODES } from './constants';
export { DEFAULT_TOOLBAR_OPTIONS } from './constants'; 