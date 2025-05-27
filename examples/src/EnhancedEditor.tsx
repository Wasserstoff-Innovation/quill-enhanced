import React, { useEffect, useRef, useState, useCallback } from 'react';
import Quill from 'quill';

interface EnhancedEditorProps {
  initialContent?: string;
  placeholder?: string;
  onChange?: (content: string) => void;
  onExport?: (format: string, content: string) => void;
}

const EnhancedEditor: React.FC<EnhancedEditorProps> = ({
  initialContent = '',
  placeholder = 'Start typing...',
  onChange,
  onExport
}) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const quillRef = useRef<Quill | null>(null);
  const onChangeRef = useRef(onChange);
  
  // Feature states
  const [trackChanges, setTrackChanges] = useState(false);
  const [showLineNumbers, setShowLineNumbers] = useState(false);
  const [autosave, setAutosave] = useState(false);
  const [readOnly, setReadOnly] = useState(false);
  const [markdownMode, setMarkdownMode] = useState(false);
  const [wordCount, setWordCount] = useState(0);
  const [charCount, setCharCount] = useState(0);

  // Keep onChange ref updated without causing re-renders
  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  useEffect(() => {
    if (editorRef.current && !quillRef.current) {
      // Initialize Quill only once
      quillRef.current = new Quill(editorRef.current, {
        theme: 'snow',
        placeholder,
        readOnly,
        modules: {
          toolbar: {
            container: [
              [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
              [{ 'font': [] }],
              [{ 'size': ['small', false, 'large', 'huge'] }],
              ['bold', 'italic', 'underline', 'strike'],
              [{ 'color': [] }, { 'background': [] }],
              [{ 'script': 'sub'}, { 'script': 'super' }],
              [{ 'list': 'ordered'}, { 'list': 'bullet' }, { 'list': 'check' }],
              [{ 'indent': '-1'}, { 'indent': '+1' }],
              [{ 'direction': 'rtl' }],
              [{ 'align': [] }],
              ['link', 'image', 'video', 'formula'],
              ['blockquote', 'code-block'],
              ['clean']
            ],
            handlers: {
              // Add custom handlers here if needed
            }
          },
          history: {
            delay: 2000,
            maxStack: 500,
            userOnly: true
          }
        }
      });

      // Set initial content
      if (initialContent) {
        quillRef.current.clipboard.dangerouslyPasteHTML(initialContent);
      }

      // Listen for changes
      quillRef.current.on('text-change', () => {
        if (onChangeRef.current && quillRef.current) {
          const content = quillRef.current.root.innerHTML;
          const text = quillRef.current.getText();
          
          // Update word and character counts
          setWordCount(text.trim().split(/\s+/).filter(word => word.length > 0).length);
          setCharCount(text.length - 1); // -1 to exclude the trailing newline
          
          onChangeRef.current(content);
        }
      });

      // Initial setup complete
    }

    return () => {
      if (quillRef.current) {
        quillRef.current.off('text-change');
        quillRef.current = null;
      }
    };
  }, []); // Empty dependency array - initialize only once

  // Update editor properties when features change
  useEffect(() => {
    if (quillRef.current) {
      quillRef.current.enable(!readOnly);
    }
  }, [readOnly]);

  // Handle autosave separately
  useEffect(() => {
    if (autosave && quillRef.current) {
      const autosaveInterval = setInterval(() => {
        console.log('Autosaved at', new Date().toLocaleTimeString());
      }, 5000);
      
      return () => clearInterval(autosaveInterval);
    }
  }, [autosave]);

  const exportContent = useCallback((format: string) => {
    if (quillRef.current && onExport) {
      const content = quillRef.current.root.innerHTML;
      onExport(format, content);
    }
  }, [onExport]);

  const insertSampleContent = useCallback(() => {
    if (quillRef.current) {
      const sampleContent = `
        <h1>Welcome to Wasserstoff Quill Enhanced!</h1>
        <p>This is a demonstration of our <strong>advanced WYSIWYG editor</strong> with the following features:</p>
        <ul>
          <li><strong>Rich Text Formatting</strong> - Bold, italic, underline, colors, and more</li>
          <li><strong>Headers and Lists</strong> - Multiple heading levels and list types</li>
          <li><strong>Track Changes</strong> - Real-time collaboration features</li>
          <li><strong>Autosave</strong> - Never lose your work</li>
          <li><strong>Export Options</strong> - PDF, DOCX, HTML, and Markdown</li>
        </ul>
        <blockquote>
          "The best editor for modern web applications" - Wasserstoff Team
        </blockquote>
        <p>Try out the different features using the controls above! 🚀</p>
      `;
      quillRef.current.clipboard.dangerouslyPasteHTML(sampleContent);
    }
  }, []);

  useEffect(() => {
    if (editorRef.current) {
      // Initialize editor with current settings
      console.log('Editor initialized');
    }
  }, [initialContent, placeholder, readOnly]);

  return (
    <div className="enhanced-editor">
      {/* Feature Controls */}
      <div className="editor-controls">
        <div className="control-group">
          <label className="control-label">
            <input
              type="checkbox"
              checked={trackChanges}
              onChange={(e) => setTrackChanges(e.target.checked)}
            />
            Track Changes
          </label>
          <label className="control-label">
            <input
              type="checkbox"
              checked={showLineNumbers}
              onChange={(e) => setShowLineNumbers(e.target.checked)}
            />
            Line Numbers
          </label>
          <label className="control-label">
            <input
              type="checkbox"
              checked={autosave}
              onChange={(e) => setAutosave(e.target.checked)}
            />
            Autosave
          </label>
          <label className="control-label">
            <input
              type="checkbox"
              checked={readOnly}
              onChange={(e) => setReadOnly(e.target.checked)}
            />
            Read Only
          </label>
          <label className="control-label">
            <input
              type="checkbox"
              checked={markdownMode}
              onChange={(e) => setMarkdownMode(e.target.checked)}
            />
            Markdown Mode
          </label>
        </div>
        
        <div className="control-group">
          <button className="control-btn" onClick={insertSampleContent}>
            📝 Insert Sample
          </button>
          <button className="control-btn" onClick={() => exportContent('html')}>
            📄 Export HTML
          </button>
          <button className="control-btn" onClick={() => exportContent('pdf')}>
            📑 Export PDF
          </button>
          <button className="control-btn" onClick={() => exportContent('docx')}>
            📘 Export DOCX
          </button>
        </div>
      </div>

      {/* Editor Container */}
      <div 
        className={`editor-wrapper ${showLineNumbers ? 'with-line-numbers' : ''} ${trackChanges ? 'with-track-changes' : ''}`}
      >
        <div 
          ref={editorRef} 
          className="quill-editor"
          style={{ minHeight: '400px' }}
        />
      </div>

      {/* Status Bar */}
      <div className="editor-status">
        <div className="status-left">
          <span className="status-item">Words: {wordCount}</span>
          <span className="status-item">Characters: {charCount}</span>
          {autosave && <span className="status-item autosave-indicator">🟢 Autosave On</span>}
          {trackChanges && <span className="status-item">📝 Tracking Changes</span>}
          {readOnly && <span className="status-item">🔒 Read Only</span>}
        </div>
        <div className="status-right">
          <span className="status-item">Wasserstoff Quill Enhanced v0.1.0</span>
        </div>
      </div>
    </div>
  );
};

export default EnhancedEditor; 