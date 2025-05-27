import React, { useEffect, useRef, useState, useCallback } from 'react';
import Quill from 'quill';
import { Editor } from '@wasserstoff/quill-enhanced';
import './EnhancedEditor.css';

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
  const [content, setContent] = useState<string>(initialContent);
  const [enableTableOfContents, setEnableTableOfContents] = useState<boolean>(false);
  const [enableExport, setEnableExport] = useState<boolean>(false);

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

  const handleChange = (delta: any) => {
    setContent(delta);
  };

  const toggleLineNumbers = () => {
    setShowLineNumbers(!showLineNumbers);
  };

  const toggleMarkdown = () => {
    setMarkdownMode(!markdownMode);
  };

  const toggleTrackChanges = () => {
    setTrackChanges(!trackChanges);
  };

  const toggleAutosave = () => {
    setAutosave(!autosave);
  };

  const toggleTableOfContents = () => {
    setEnableTableOfContents(!enableTableOfContents);
  };

  const toggleExport = () => {
    setEnableExport(!enableExport);
  };

  return (
    <div className="enhanced-editor">
      <div className="editor-container">
        <Editor
          initialContent={content}
          documentId="enhanced-doc"
          showLineNumbers={showLineNumbers}
          enableMarkdown={markdownMode}
          trackChanges={trackChanges}
          autosave={autosave}
          onChange={handleChange}
        />
      </div>
      <div className="code-container">
        <h2>Enhanced Editor Code Example</h2>
        <pre>
          {`import React, { useState } from 'react';
import { Editor } from '@wasserstoff/quill-enhanced';

const EnhancedEditor = () => {
  const [content, setContent] = useState('Hello, World!');
  const [showLineNumbers, setShowLineNumbers] = useState(${showLineNumbers});
  const [enableMarkdown, setEnableMarkdown] = useState(${markdownMode});
  const [trackChanges, setTrackChanges] = useState(${trackChanges});
  const [autosave, setAutosave] = useState(${autosave});
  const [enableTableOfContents, setEnableTableOfContents] = useState(${enableTableOfContents});
  const [enableExport, setEnableExport] = useState(${enableExport});

  const handleChange = (delta) => {
    setContent(delta);
  };

  return (
    <Editor
      initialContent={content}
      documentId="enhanced-doc"
      showLineNumbers={showLineNumbers}
      enableMarkdown={enableMarkdown}
      trackChanges={trackChanges}
      autosave={autosave}
      onChange={handleChange}
    />
  );
};`}
        </pre>
        <div className="controls">
          <button onClick={toggleLineNumbers}>Toggle Line Numbers</button>
          <button onClick={toggleMarkdown}>Toggle Markdown</button>
          <button onClick={toggleTrackChanges}>Toggle Track Changes</button>
          <button onClick={toggleAutosave}>Toggle Autosave</button>
          <button onClick={toggleTableOfContents}>Toggle Table of Contents</button>
          <button onClick={toggleExport}>Toggle Export</button>
        </div>
      </div>
    </div>
  );
};

export default EnhancedEditor; 