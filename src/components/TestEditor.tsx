import React, { useRef, useState, useEffect } from 'react';
import { Editor } from '../index';
import type { EditorRef } from '../index';
import { MarkdownPreview } from './MarkdownPreview';
import { deltaToMarkdown, fromMarkdown } from '../utils/markdownUtils';
import Quill from 'quill';

const Delta = Quill.import('delta');
type Delta = typeof Delta;

export const TestEditor: React.FC = () => {
  const editorRef = useRef<EditorRef>(null);
  const [content, setContent] = useState<Delta>({ ops: [] });
  const [markdown, setMarkdown] = useState<string>('');
  const [showPreview, setShowPreview] = useState<boolean>(false);
  const [showLineNumbers, setShowLineNumbers] = useState(true);
  const [enableMarkdown, setEnableMarkdown] = useState(true);

  const handleSave = (content: string) => {
    console.log('Saving content:', content);
  };

  const handleContentChange = (delta: Delta) => {
    setContent(delta);
    setMarkdown(deltaToMarkdown(delta));
  };

  const handleMarkdownChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newMarkdown = event.target.value;
    setMarkdown(newMarkdown);
    const newDelta = fromMarkdown(newMarkdown);
    setContent(newDelta);
    if (editorRef.current) {
      editorRef.current.setContent(newDelta);
    }
  };

  return (
    <div className="test-editor">
      <div className="editor-container" style={{ marginBottom: '1rem' }}>
        <Editor
          ref={editorRef}
          value={content}
          onChange={handleContentChange}
          placeholder="Start typing..."
          showLineNumbers={showLineNumbers}
          enableMarkdown={enableMarkdown}
          onSave={handleSave}
        />
      </div>

      <div className="markdown-container">
        <div className="markdown-header" style={{ marginBottom: '0.5rem' }}>
          <button
            onClick={() => setShowPreview(!showPreview)}
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: '#4a90e2',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            {showPreview ? 'Edit Markdown' : 'Preview Markdown'}
          </button>
        </div>

        {showPreview ? (
          <MarkdownPreview markdown={markdown} />
        ) : (
          <textarea
            value={markdown}
            onChange={handleMarkdownChange}
            style={{
              width: '100%',
              minHeight: '200px',
              padding: '1rem',
              border: '1px solid #ccc',
              borderRadius: '4px',
              fontFamily: 'monospace',
              fontSize: '14px',
              lineHeight: '1.5'
            }}
          />
        )}
      </div>
    </div>
  );
}; 