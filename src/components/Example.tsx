import React, { useRef, useState } from 'react';
import { Editor } from '../index';
import type { EditorRef } from '../index';

const Example: React.FC = () => {
  const editorRef = useRef<EditorRef>(null);
  const [trackChanges, setTrackChanges] = useState(true);
  const [showLineNumbers, setShowLineNumbers] = useState(true);
  const [enableMarkdown, setEnableMarkdown] = useState(true);

  const handleSave = (content: any) => {
    console.log('Document saved:', content);
  };

  const handleChange = (content: any) => {
    console.log('Content changed:', content);
  };

  const handleGetContent = (format: 'html' | 'delta' | 'text' | 'markdown' = 'html') => {
    const content = editorRef.current?.getContent(format);
    console.log(`Content (${format}):`, content);
  };

  const handleSetContent = () => {
    editorRef.current?.setContent('<p>This is new content set programmatically!</p>', 'html');
  };

  const handleAcceptAllChanges = () => {
    editorRef.current?.acceptAllChanges();
  };

  const handleRejectAllChanges = () => {
    editorRef.current?.rejectAllChanges();
  };

  const handleExportDocx = async () => {
    try {
      await editorRef.current?.exportDocx();
      console.log('Document exported to DOCX');
    } catch (error) {
      console.error('Error exporting to DOCX:', error);
    }
  };

  const handleExportPDF = () => {
    try {
      editorRef.current?.exportPDF();
      console.log('Document exported to PDF');
    } catch (error) {
      console.error('Error exporting to PDF:', error);
    }
  };

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '20px' }}>
      <h1>Document Editor Example</h1>
      
      {/* Feature Toggles */}
      <div style={{ marginBottom: '20px', padding: '10px', backgroundColor: '#f5f5f5', borderRadius: '4px' }}>
        <h3>Feature Toggles</h3>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <label>
            <input
              type="checkbox"
              checked={trackChanges}
              onChange={(e) => setTrackChanges(e.target.checked)}
            />
            Track Changes
          </label>
          <label>
            <input
              type="checkbox"
              checked={showLineNumbers}
              onChange={(e) => setShowLineNumbers(e.target.checked)}
            />
            Show Line Numbers
          </label>
          <label>
            <input
              type="checkbox"
              checked={enableMarkdown}
              onChange={(e) => setEnableMarkdown(e.target.checked)}
            />
            Enable Markdown
          </label>
        </div>
      </div>

      {/* Editor */}
      <Editor
        ref={editorRef}
        documentId="example-1"
        version={1}
        initialContent="<p>Welcome to the document editor! Start typing here...</p>"
        trackChanges={trackChanges}
        autosave={true}
        header={<div style={{ padding: '10px', backgroundColor: '#f5f5f5' }}>Document Header</div>}
        marginLeft="1in"
        marginRight="1in"
        marginTop="1in"
        showLineNumbers={showLineNumbers}
        enableMarkdown={enableMarkdown}
        onSave={handleSave}
        onChange={handleChange}
      />

      {/* Test Controls */}
      <div style={{ marginTop: '20px', padding: '10px', backgroundColor: '#f5f5f5', borderRadius: '4px' }}>
        <h3>Test Controls</h3>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button onClick={() => handleGetContent('html')}>Get HTML</button>
          <button onClick={() => handleGetContent('delta')}>Get Delta</button>
          <button onClick={() => handleGetContent('text')}>Get Text</button>
          <button onClick={() => handleGetContent('markdown')}>Get Markdown</button>
          <button onClick={handleSetContent}>Set New Content</button>
          <button onClick={handleAcceptAllChanges}>Accept All Changes</button>
          <button onClick={handleRejectAllChanges}>Reject All Changes</button>
          <button onClick={handleExportDocx}>Export DOCX</button>
          <button onClick={handleExportPDF}>Export PDF</button>
        </div>
      </div>
    </div>
  );
};

export default Example; 