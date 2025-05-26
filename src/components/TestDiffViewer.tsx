import React, { useState } from 'react';
import { Delta } from 'quill';
import DiffViewer from './DiffViewer';

const TestDiffViewer: React.FC = () => {
  const [viewMode, setViewMode] = useState<'unified' | 'split'>('unified');

  // Sample content for testing
  const originalContent = new Delta()
    .insert('This is the original document.\n')
    .insert('It contains some text that will be modified.\n')
    .insert('And some text that will be deleted.\n')
    .insert('The end.');

  const modifiedContent = new Delta()
    .insert('This is the modified document.\n')
    .insert('It contains some text that has been changed.\n')
    .insert('And some new text has been added.\n')
    .insert('The end.');

  return (
    <div className="test-diff-viewer">
      <div className="controls">
        <button
          className={viewMode === 'unified' ? 'active' : ''}
          onClick={() => setViewMode('unified')}
        >
          Unified View
        </button>
        <button
          className={viewMode === 'split' ? 'active' : ''}
          onClick={() => setViewMode('split')}
        >
          Split View
        </button>
      </div>

      <DiffViewer
        originalContent={originalContent}
        modifiedContent={modifiedContent}
        viewMode={viewMode}
        options={{
          ignoreFormatting: false,
          ignoreWhitespace: false
        }}
      />

      <style>{`
        .test-diff-viewer {
          padding: 20px;
          max-width: 1200px;
          margin: 0 auto;
        }

        .controls {
          margin-bottom: 20px;
          display: flex;
          gap: 10px;
        }

        .controls button {
          padding: 8px 16px;
          border: 1px solid #ccc;
          border-radius: 4px;
          background: white;
          cursor: pointer;
          transition: all 0.2s;
        }

        .controls button:hover {
          background: #f5f5f5;
        }

        .controls button.active {
          background: #e6f3ff;
          border-color: #1890ff;
          color: #1890ff;
        }
      `}</style>
    </div>
  );
};

export default TestDiffViewer; 