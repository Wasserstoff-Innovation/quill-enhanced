import React, { useRef, useEffect, useState, forwardRef, useImperativeHandle } from 'react';
import Quill from 'quill';
import { TrackChanges } from '../plugins/TrackChanges';
import type { Change } from '../plugins/types';
import { Toolbar } from './Toolbar';
import { MarkdownPreview } from './MarkdownPreview';
import { DiffViewer } from './DiffViewer';
import { KeyboardShortcutsManager } from '../utils/keyboardShortcuts';
import { AutosavePlugin } from '../plugins/Autosave';
import { LineNumbersPlugin } from '../plugins/LineNumbers';
// import { MarkdownPlugin } from '../plugins/MarkdownPlugin';
import { deltaToMarkdown, fromMarkdown } from '../utils/markdownUtils';
import { exportToDocx, exportToPDF } from '../utils/exportUtils';

const Delta = Quill.import('delta');

interface EditorProps {
  initialContent?: string | any;
  value?: any;
  documentId?: string;
  metadata?: Record<string, any>;
  version?: number;
  onContentChange?: (delta: any) => void;
  onMetadataChange?: (metadata: Record<string, any>) => void;
  trackChanges?: boolean;
  currentUser?: string;
  onChangesUpdate?: (changes: Change[]) => void;
  autosave?: boolean;
  header?: React.ReactNode;
  marginLeft?: string;
  marginRight?: string;
  marginTop?: string;
  showLineNumbers?: boolean;
  enableMarkdown?: boolean;
  placeholder?: string;
  onSave?: (content: any) => void;
  onChange?: (content: any) => void;
  className?: string;
  readOnly?: boolean;
  autosaveInterval?: number;
  toolbar?: {
    container: (string | { [key: string]: any })[][];
  };
}

export interface EditorRef {
  getContent: (format?: 'html' | 'delta' | 'text' | 'markdown') => any;
  setContent: (content: string | any, format?: 'html' | 'delta' | 'text' | 'markdown') => void;
  focus: () => void;
  blur: () => void;
  enable: () => void;
  disable: () => void;
  isEnabled: () => boolean;
  getText: () => string;
  setText: (text: string) => void;
  getSelection: () => { index: number; length: number } | null;
  setSelection: (index: number, length: number) => void;
  getFormat: () => Record<string, any>;
  format: (format: string, value: any) => void;
  acceptChange: (changeId: string) => void;
  rejectChange: (changeId: string) => void;
  acceptAllChanges: () => void;
  rejectAllChanges: () => void;
  getChanges: () => Change[];
  getPendingChanges: () => Change[];
  exportDocx: () => Promise<void>;
  exportPDF: () => void;
  exportHTML: () => string;
  exportMarkdown: () => string;
}

const Editor = forwardRef<EditorRef, EditorProps>(({
  initialContent = '',
  value,
  documentId,
  metadata = {},
  version = 1,
  onContentChange,
  onMetadataChange,
  trackChanges = false,
  currentUser = 'anonymous',
  onChangesUpdate,
  autosave = false,
  header,
  marginLeft = '1in',
  marginRight = '1in',
  marginTop = '1in',
  showLineNumbers = false,
  enableMarkdown = false,
  placeholder = 'Start typing...',
  onSave,
  onChange,
  className = '',
  readOnly = false,
  autosaveInterval = 5000
}, ref) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const quillRef = useRef<Quill | null>(null);
  const [trackChangesPlugin, setTrackChangesPlugin] = useState<TrackChanges | null>(null);
  const [isMarkdownMode, setIsMarkdownMode] = useState(false);
  const [mode, setMode] = useState<'wysiwyg' | 'markdown'>('wysiwyg');
  const [markdownContent, setMarkdownContent] = useState('');
  const [showDiff, setShowDiff] = useState(false);
  const [originalContent, setOriginalContent] = useState<any>(null);

  useEffect(() => {
    if (editorRef.current && !quillRef.current) {
      // Initialize Quill
      const quill = new Quill(editorRef.current, {
        theme: 'snow',
        modules: {
          toolbar: false, // Disable default toolbar since we're using custom one
          history: {
            delay: 2000,
            maxStack: 500,
            userOnly: true
          }
        },
        placeholder
      });

      // Initialize plugins
      if (showLineNumbers) {
        new LineNumbersPlugin(quill);
      }

      if (onSave && autosave) {
        new AutosavePlugin(quill, {
          interval: autosaveInterval,
          onSave
        });
      }

      // Initialize keyboard shortcuts
      new KeyboardShortcutsManager(quill);

      // Set initial content
      if (value) {
        quill.setContents(value);
      } else if (typeof initialContent === 'string') {
        quill.clipboard.dangerouslyPasteHTML(initialContent);
      } else {
        quill.setContents(initialContent);
      }

      // Initialize track changes if enabled
      if (trackChanges) {
        const plugin = new TrackChanges(quill, {
          enabled: true,
          currentUser,
          onChangesUpdate: (changes: Change[]) => {
            onChangesUpdate?.(changes);
          }
        });
        setTrackChangesPlugin(plugin);
      }

      // Set up change handler
      const handleTextChange = (delta: any, oldDelta: any, source: any) => {
        if (source === 'user') {
          const newContent = quill.getContents();
          // Process changes if track changes is enabled
          if (trackChanges && trackChangesPlugin) {
            trackChangesPlugin.processDelta(newContent);
          }
          // Notify parent component
          onContentChange?.(newContent);
          onChange?.(newContent);
          if (mode === 'markdown') {
            setMarkdownContent(deltaToMarkdown(newContent));
          }
        }
      };
      quill.on('text-change', handleTextChange);

      quillRef.current = quill;

      return () => {
        quill.off('text-change', handleTextChange);
        if (trackChangesPlugin) {
          trackChangesPlugin.clearChanges();
        }
      };
    }
  }, [documentId, onSave, onContentChange, readOnly, showLineNumbers, autosaveInterval, trackChanges, currentUser, onChangesUpdate, autosave, value, initialContent, placeholder, mode]);

  // Update content when value prop changes
  useEffect(() => {
    if (quillRef.current && value) {
      quillRef.current.setContents(value);
    }
  }, [value]);

  // Update track changes options when props change
  useEffect(() => {
    if (trackChangesPlugin) {
      trackChangesPlugin.updateOptions({
        enabled: trackChanges,
        currentUser
      });
    }
  }, [trackChanges, currentUser, trackChangesPlugin]);

  // Handle export
  const handleExport = async (format: 'docx' | 'pdf') => {
    if (!quillRef.current) return;

    const content = quillRef.current.getContents();
    if (format === 'docx') {
      await exportToDocx(content, 'document.docx');
    } else {
      exportToPDF(content, 'document.pdf');
    }
  };

  // Handle diff toggle
  const handleToggleDiff = () => {
    if (!showDiff) {
      setOriginalContent(quillRef.current?.getContents());
    }
    setShowDiff(!showDiff);
  };

  // Handle change acceptance
  const handleAcceptChange = () => {
    if (trackChangesPlugin) {
      trackChangesPlugin.acceptAllChanges();
      setShowDiff(false);
    }
  };

  // Handle change rejection
  const handleRejectChange = () => {
    if (trackChangesPlugin) {
      trackChangesPlugin.rejectAllChanges();
      setShowDiff(false);
    }
  };

  // Expose methods via ref
  useImperativeHandle(ref, () => ({
    getContent: (format = 'delta') => {
      if (!quillRef.current) return null;
      switch (format) {
        case 'html':
          return quillRef.current.root.innerHTML;
        case 'text':
          return quillRef.current.getText();
        case 'markdown':
          return deltaToMarkdown(quillRef.current.getContents());
        default:
          return quillRef.current.getContents();
      }
    },
    setContent: (content, format = 'delta') => {
      if (!quillRef.current) return;
      switch (format) {
        case 'html':
          quillRef.current.clipboard.dangerouslyPasteHTML(content as string);
          break;
        case 'text':
          quillRef.current.setText(content as string);
          break;
        case 'markdown':
          quillRef.current.setContents(fromMarkdown(content as string));
          break;
        default:
          quillRef.current.setContents(content as any);
      }
    },
    focus: () => quillRef.current?.focus(),
    blur: () => quillRef.current?.blur(),
    enable: () => quillRef.current?.enable(),
    disable: () => quillRef.current?.disable(),
    isEnabled: () => quillRef.current?.isEnabled() || false,
    getText: () => quillRef.current?.getText() || '',
    setText: (text: string) => quillRef.current?.setText(text),
    getSelection: () => {
      const selection = quillRef.current?.getSelection();
      return selection ? { index: selection.index, length: selection.length } : null;
    },
    setSelection: (index: number, length: number) => quillRef.current?.setSelection(index, length),
    getFormat: () => quillRef.current?.getFormat() || {},
    format: (format: string, value: any) => quillRef.current?.format(format, value),
    acceptChange: (changeId: string) => trackChangesPlugin?.acceptChange(changeId),
    rejectChange: (changeId: string) => trackChangesPlugin?.rejectChange(changeId),
    acceptAllChanges: () => trackChangesPlugin?.acceptAllChanges(),
    rejectAllChanges: () => trackChangesPlugin?.rejectAllChanges(),
    getChanges: () => trackChangesPlugin?.getChanges() || [],
    getPendingChanges: () => trackChangesPlugin?.getPendingChanges() || [],
    exportDocx: () => handleExport('docx'),
    exportPDF: () => handleExport('pdf'),
    exportHTML: () => quillRef.current?.root.innerHTML || '',
    exportMarkdown: () => {
      const content = quillRef.current?.getContents();
      return content ? deltaToMarkdown(content) : '';
    }
  }));

  return (
    <div className={`flex flex-col h-full ${className}`}>
      {header}
      <Toolbar
        quill={quillRef.current}
        className="border-b"
      />
      <div className="flex-1 overflow-auto">
        {showDiff ? (
          <DiffViewer
            originalContent={originalContent}
            modifiedContent={quillRef.current?.getContents()}
            onAcceptChange={handleAcceptChange}
            onRejectChange={handleRejectChange}
            onAcceptAllChanges={handleAcceptChange}
            onRejectAllChanges={handleRejectChange}
          />
        ) : mode === 'markdown' ? (
          <MarkdownPreview content={markdownContent} />
        ) : (
          <div ref={editorRef} className="h-full" />
        )}
      </div>
      <div className="flex gap-2 p-2 border-t">
        <button
          onClick={() => handleExport('docx')}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Export DOCX
        </button>
        <button
          onClick={() => handleExport('pdf')}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Export PDF
        </button>
        {trackChanges && (
          <button
            onClick={handleToggleDiff}
            className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
          >
            {showDiff ? 'Hide Changes' : 'Show Changes'}
          </button>
        )}
      </div>
      <style>{`
        .editor-container {
          border: 1px solid #ccc;
          border-radius: 4px;
          overflow: hidden;
        }

        .ql-container {
          height: 400px;
          font-size: 16px;
        }

        .ql-editor {
          padding: 16px;
        }

        ${showLineNumbers ? `
          .ql-editor p::before {
            counter-increment: line;
            content: counter(line);
            display: inline-block;
            width: 3em;
            margin-right: 0.5em;
            color: #aaa;
            user-select: none;
          }
        ` : ''}
      `}</style>
    </div>
  );
});

Editor.displayName = 'Editor';

export default Editor;