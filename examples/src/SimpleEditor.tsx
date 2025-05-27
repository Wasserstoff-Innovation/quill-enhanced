import React, { useState, useEffect, useRef } from 'react';
import Quill from 'quill';

interface SimpleEditorProps {
  initialContent?: string;
  placeholder?: string;
}

const SimpleEditor: React.FC<SimpleEditorProps> = ({ 
  initialContent = '<p>Start typing...</p>',
  placeholder = 'Enter your text here...'
}) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const quillRef = useRef<Quill | null>(null);

  useEffect(() => {
    if (editorRef.current && !quillRef.current) {
      // Initialize Quill only once
      quillRef.current = new Quill(editorRef.current, {
        theme: 'snow',
        placeholder,
        modules: {
          toolbar: [
            [{ 'header': [1, 2, 3, false] }],
            ['bold', 'italic', 'underline', 'strike'],
            [{ 'list': 'ordered'}, { 'list': 'bullet' }],
            [{ 'color': [] }, { 'background': [] }],
            [{ 'align': [] }],
            ['link', 'blockquote', 'code-block'],
            ['clean']
          ]
        }
      });

      // Set initial content
      if (initialContent) {
        quillRef.current.clipboard.dangerouslyPasteHTML(initialContent);
      }

      // Listen for changes
      quillRef.current.on('text-change', () => {
        if (quillRef.current) {
          const newContent = quillRef.current.root.innerHTML;
          // Content changed - could notify parent here if needed
        }
      });
    }

    return () => {
      if (quillRef.current) {
        quillRef.current.off('text-change');
        quillRef.current = null;
      }
    };
  }, [initialContent, placeholder]);

  return (
    <div 
      ref={editorRef} 
      style={{ 
        minHeight: '300px',
        background: 'rgba(31, 41, 55, 0.6)',
        borderRadius: '0.75rem',
        border: '1px solid rgba(255, 255, 255, 0.1)'
      }} 
    />
  );
};

export default SimpleEditor; 