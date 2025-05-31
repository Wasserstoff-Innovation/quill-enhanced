import React, { useRef, useEffect, useState, forwardRef, useImperativeHandle } from 'react';
import Quill from 'quill';
import { TrackChanges } from '../plugins/TrackChanges';
import type { Change } from '../plugins/types';
import { MarkdownPreview } from './MarkdownPreview';
import { DiffViewer } from './DiffViewer';
import { KeyboardShortcutsManager } from '../utils/keyboardShortcuts';
import { AutosavePlugin } from '../plugins/Autosave';
import { LineNumbersPlugin } from '../plugins/LineNumbers';
// import { MarkdownPlugin } from '../plugins/MarkdownPlugin';
import { deltaToMarkdown, fromMarkdown } from '../utils/markdownUtils';
import { exportToDocx, exportToPDF } from '../utils/exportUtils';
import './Editor.css';
import { FaBold, FaItalic, FaUnderline, FaListUl, FaListOl, FaHeading, FaAlignLeft, FaAlignCenter, FaAlignRight, FaCode, FaQuoteRight, FaUndo, FaRedo, FaSave, FaEye, FaMarkdown, FaDownload } from 'react-icons/fa';
import { Toolbar } from './Toolbar';

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
  showToolbar?: boolean;
  exportOptions?: {
    enablePdfExport?: boolean;
    enableDocxExport?: boolean;
    enableHtmlExport?: boolean;
    enableMarkdownExport?: boolean;
  };
  theme?: string;
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
  undo: () => void;
  redo: () => void;
  save: () => void;
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

type FeatureTogglesProps = {
  showLineNumbers: boolean;
  setShowLineNumbers: (v: boolean) => void;
  trackChanges: boolean;
  setTrackChanges: (v: boolean) => void;
  autosave: boolean;
  setAutosave: (v: boolean) => void;
  enableMarkdown: boolean;
  setEnableMarkdown: (v: boolean) => void;
};

const FeatureToggles: React.FC<FeatureTogglesProps> = ({ showLineNumbers, setShowLineNumbers, trackChanges, setTrackChanges, autosave, setAutosave, enableMarkdown, setEnableMarkdown }) => (
  <div className="editor-feature-toggles">
    <label>
      <input type="checkbox" checked={showLineNumbers} onChange={e => setShowLineNumbers(e.target.checked)} style={{ position: 'absolute', opacity: 0, width: 0, height: 0 }} />
      <span className="pill-toggle" aria-hidden="true" />
      <span>Line Numbers</span>
    </label>
    <label>
      <input type="checkbox" checked={trackChanges} onChange={e => setTrackChanges(e.target.checked)} style={{ position: 'absolute', opacity: 0, width: 0, height: 0 }} />
      <span className="pill-toggle" aria-hidden="true" />
      <span>Track Changes</span>
    </label>
    <label>
      <input type="checkbox" checked={autosave} onChange={e => setAutosave(e.target.checked)} style={{ position: 'absolute', opacity: 0, width: 0, height: 0 }} />
      <span className="pill-toggle" aria-hidden="true" />
      <span>Autosave</span>
    </label>
    <label>
      <input type="checkbox" checked={enableMarkdown} onChange={e => setEnableMarkdown(e.target.checked)} style={{ position: 'absolute', opacity: 0, width: 0, height: 0 }} />
      <span className="pill-toggle" aria-hidden="true" />
      <span>Markdown</span>
    </label>
  </div>
);

export const Editor: React.FC<EditorProps> = React.forwardRef<EditorRef, EditorProps>(({
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
  autosaveInterval = 5000,
  showToolbar = true,
  exportOptions = {
    enablePdfExport: true,
    enableDocxExport: true,
    enableHtmlExport: true,
    enableMarkdownExport: true
  },
  theme
}, ref) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const quillRef = useRef<Quill | null>(null);
  const [isQuillReady, setIsQuillReady] = useState(false);
  const [trackChangesPlugin, setTrackChangesPlugin] = useState<TrackChanges | null>(null);
  const [lineNumbersPlugin, setLineNumbersPlugin] = useState<LineNumbersPlugin | null>(null);
  const [autosavePlugin, setAutosavePlugin] = useState<AutosavePlugin | null>(null);
  const [isMarkdownMode, setIsMarkdownMode] = useState(false);
  const [mode, setMode] = useState<'wysiwyg' | 'markdown'>('wysiwyg');
  const [markdownContent, setMarkdownContent] = useState('');
  const [showDiff, setShowDiff] = useState(false);
  const [originalContent, setOriginalContent] = useState<any>(null);
  // Add local state for feature toggles
  const [localShowLineNumbers, setLocalShowLineNumbers] = useState(false);
  const [localTrackChanges, setLocalTrackChanges] = useState(false);
  const [localAutosave, setLocalAutosave] = useState(false);
  const [localEnableMarkdown, setLocalEnableMarkdown] = useState(false);

  // Sync local states with props
  useEffect(() => {
    setLocalShowLineNumbers(showLineNumbers);
    setLocalTrackChanges(trackChanges);
    setLocalAutosave(autosave);
    setLocalEnableMarkdown(enableMarkdown);
  }, [showLineNumbers, trackChanges, autosave, enableMarkdown]);

  // Initialize Quill editor
  useEffect(() => {
    if (editorRef.current && !quillRef.current) {
      try {
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
          placeholder,
          readOnly
        });

        // Set initial content
        if (value) {
          quill.setContents(value);
        } else if (typeof initialContent === 'string') {
          quill.clipboard.dangerouslyPasteHTML(initialContent);
        } else {
          quill.setContents(initialContent);
        }

        // Initialize keyboard shortcuts
        new KeyboardShortcutsManager(quill);

        quillRef.current = quill;
        setIsQuillReady(true);
      } catch (error) {
        console.error('Failed to initialize Quill:', error);
      }
    }
  }, [documentId, placeholder, readOnly, value, initialContent]);

  // Handle plugin initialization and updates
  useEffect(() => {
    if (!quillRef.current) return;

    const quill = quillRef.current;

    // Handle Line Numbers Plugin
    if (localShowLineNumbers) {
      if (!lineNumbersPlugin) {
        console.log('Initializing Line Numbers Plugin');
        const plugin = new LineNumbersPlugin(quill, { enabled: true });
        setLineNumbersPlugin(plugin);
      }
    } else {
      if (lineNumbersPlugin) {
        console.log('Disabling Line Numbers Plugin');
        lineNumbersPlugin.disable();
        setLineNumbersPlugin(null);
      }
    }

    // Handle Track Changes Plugin
    if (localTrackChanges) {
      if (!trackChangesPlugin) {
        console.log('Initializing Track Changes Plugin');
        const plugin = new TrackChanges(quill, {
          enabled: true,
          currentUser,
          onChangesUpdate: (changes: Change[]) => {
            onChangesUpdate?.(changes);
            console.log('Changes updated:', changes);
          }
        });
        setTrackChangesPlugin(plugin);
      } else {
        // Enable existing plugin
        trackChangesPlugin.enable();
        trackChangesPlugin.updateOptions({
          currentUser
        });
      }
    } else if (trackChangesPlugin) {
      // Just disable, don't destroy the plugin
      console.log('Disabling Track Changes Plugin');
      trackChangesPlugin.disable();
    }

    // Handle Autosave Plugin
    if (localAutosave && !autosavePlugin) {
      console.log('Initializing Autosave Plugin');
      const plugin = new AutosavePlugin(quill, {
        enabled: true,
        interval: autosaveInterval,
        documentId: documentId || 'default-doc',
        onSave: (content, draftId) => {
          console.log('Auto-saved content with ID:', draftId);
          onSave?.(content);
        },
        onError: (error) => {
          console.error('Autosave error:', error);
        }
      });
      setAutosavePlugin(plugin);
    } else if (!localAutosave && autosavePlugin) {
      console.log('Disabling Autosave Plugin');
      autosavePlugin.disable();
      setAutosavePlugin(null);
    } else if (autosavePlugin) {
      autosavePlugin.setInterval(autosaveInterval);
    }

  }, [localShowLineNumbers, localTrackChanges, localAutosave, currentUser, onChangesUpdate, onSave, autosaveInterval, documentId, trackChangesPlugin, lineNumbersPlugin, autosavePlugin]);

  // Handle content changes
  useEffect(() => {
    if (!quillRef.current) return;

    const quill = quillRef.current;

    const handleTextChange = (delta: any, oldDelta: any, source: any) => {
      if (source === 'user') {
        const newContent = quill.getContents();
        
        // Notify parent component
        onContentChange?.(newContent);
        onChange?.(newContent);
        
        if (mode === 'markdown') {
          setMarkdownContent(deltaToMarkdown(newContent));
        }
      }
    };

    quill.on('text-change', handleTextChange);

    return () => {
      quill.off('text-change', handleTextChange);
    };
  }, [onContentChange, onChange, mode]);

  // Update content when value prop changes
  useEffect(() => {
    if (quillRef.current && value) {
      quillRef.current.setContents(value);
    }
  }, [value]);

  // Handle export
  const handleExport = async (format: 'docx' | 'pdf' | 'html' | 'markdown') => {
    if (!quillRef.current) return;

    const content = quillRef.current.getContents();
    switch (format) {
      case 'docx':
        await exportToDocx(content, 'document.docx');
        break;
      case 'pdf':
        exportToPDF(content, 'document.pdf');
        break;
      case 'html':
        const htmlContent = quillRef.current.root.innerHTML;
        console.log('HTML content:', htmlContent);
        break;
      case 'markdown':
        const markdownContent = deltaToMarkdown(content);
        console.log('Markdown content:', markdownContent);
        break;
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

  // Undo/Redo handlers
  const handleUndo = () => {
    if (localTrackChanges && trackChangesPlugin) {
      trackChangesPlugin.undo();
    } else if (quillRef.current && quillRef.current.history) {
      quillRef.current.history.undo();
    }
  };
  const handleRedo = () => {
    if (localTrackChanges && trackChangesPlugin) {
      trackChangesPlugin.redo();
    } else if (quillRef.current && quillRef.current.history) {
      quillRef.current.history.redo();
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
    },
    undo: () => quillRef.current?.history.undo(),
    redo: () => quillRef.current?.history.redo(),
    save: () => {
      if (onSave && quillRef.current) {
        onSave(quillRef.current.getContents());
      }
    }
  }));

  return (
    <div className={`editor-root ${readOnly ? 'read-only' : ''} ${theme === 'dark' ? 'dark' : ''}`}>
      {header}
      {showToolbar && !readOnly && (
        <Toolbar 
          quill={quillRef.current}
          onExport={handleExport}
          onUndo={() => quillRef.current?.history.undo()}
          onRedo={() => quillRef.current?.history.redo()}
          exportOptions={exportOptions}
        />
      )}
      <div className="editor-content">
        {mode === 'markdown' ? (
          <MarkdownPreview content={markdownContent} />
        ) : (
          <div ref={editorRef} className="quill-editor" />
        )}
      </div>
      {readOnly && (
        <div className="editor-readonly-notice">
          <span className="editor-readonly-icon">🔒</span>
          <span className="editor-readonly-text">This document is in read-only mode</span>
        </div>
      )}
    </div>
  );
});

Editor.displayName = 'Editor';

export default Editor;