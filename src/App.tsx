import React, { useState } from 'react';
import TestEditor from './components/TestEditor';
import TestDiffViewer from './components/TestDiffViewer';
import './App.css';

function App() {
  const [activeTab, setActiveTab] = useState<'editor' | 'diff'>('editor');

  return (
    <div className="App">
      <div className="tabs">
        <button
          className={activeTab === 'editor' ? 'active' : ''}
          onClick={() => setActiveTab('editor')}
        >
          Editor Test
        </button>
        <button
          className={activeTab === 'diff' ? 'active' : ''}
          onClick={() => setActiveTab('diff')}
        >
          Diff Viewer Test
        </button>
      </div>

      <div className="content">
        {activeTab === 'editor' ? <TestEditor /> : <TestDiffViewer />}
      </div>

      <style>{`
        .tabs {
          display: flex;
          gap: 10px;
          margin-bottom: 20px;
          padding: 10px;
          background: #f5f5f5;
          border-radius: 4px;
        }

        .tabs button {
          padding: 8px 16px;
          border: 1px solid #ccc;
          border-radius: 4px;
          background: white;
          cursor: pointer;
          transition: all 0.2s;
        }

        .tabs button:hover {
          background: #f0f0f0;
        }

        .tabs button.active {
          background: #e6f3ff;
          border-color: #1890ff;
          color: #1890ff;
        }

        .content {
          background: white;
          border-radius: 4px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        }
      `}</style>
    </div>
  );
}

export default App;
