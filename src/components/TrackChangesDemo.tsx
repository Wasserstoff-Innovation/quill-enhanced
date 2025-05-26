import React, { useRef, useState } from 'react';
import Editor, { EditorRef } from './Editor';
import { Change } from '../plugins/TrackChanges';

const TrackChangesDemo: React.FC = () => {
  const editorRef = useRef<EditorRef>(null);
  const [changes, setChanges] = useState<Change[]>([]);
  const [currentUser, setCurrentUser] = useState('user1');
  const [showDiff, setShowDiff] = useState(false);

  const handleChangesUpdate = (newChanges: Change[]) => {
    setChanges(newChanges);
  };

  const handleAcceptChange = (changeId: string) => {
    editorRef.current?.acceptChange(changeId);
  };

  const handleRejectChange = (changeId: string) => {
    editorRef.current?.rejectChange(changeId);
  };

  const handleAcceptAll = () => {
    editorRef.current?.acceptAllChanges();
  };

  const handleRejectAll = () => {
    editorRef.current?.rejectAllChanges();
  };

  const handleUserChange = (user: string) => {
    setCurrentUser(user);
  };

  const handleToggleDiff = () => {
    setShowDiff(!showDiff);
  };

  return (
    <div className="track-changes-demo">
      <div className="demo-container">
        <h1>Track Changes Demo</h1>
        
        {/* User Selection */}
        <div className="user-selection">
          <label>Current User:</label>
          <select
            value={currentUser}
            onChange={(e) => handleUserChange(e.target.value)}
          >
            <option value="user1">User 1</option>
            <option value="user2">User 2</option>
            <option value="user3">User 3</option>
          </select>
        </div>

        {/* Editor */}
        <div className="editor-container">
          <Editor
            ref={editorRef}
            trackChanges
            currentUser={currentUser}
            onChangesUpdate={handleChangesUpdate}
            showLineNumbers
            enableMarkdown
          />
        </div>

        {/* Change Controls */}
        <div className="change-controls">
          <button
            onClick={handleToggleDiff}
            className="btn btn-primary"
          >
            {showDiff ? 'Hide Changes' : 'Show Changes'}
          </button>
          <button
            onClick={handleAcceptAll}
            className="btn btn-success"
          >
            Accept All
          </button>
          <button
            onClick={handleRejectAll}
            className="btn btn-danger"
          >
            Reject All
          </button>
        </div>

        {/* Changes List */}
        {changes.length > 0 && (
          <div className="changes-list">
            <h2>Changes</h2>
            <div className="changes-container">
              {changes.map((change) => (
                <div
                  key={change.id}
                  className={`change-item ${
                    change.accepted
                      ? 'accepted'
                      : change.rejected
                      ? 'rejected'
                      : 'pending'
                  }`}
                >
                  <div className="change-header">
                    <div className="change-info">
                      <span className="author">{change.author}</span>
                      <span className="separator">-</span>
                      <span className="type">{change.type}</span>
                      {change.text && (
                        <span className="text">{change.text}</span>
                      )}
                    </div>
                    {!change.accepted && !change.rejected && (
                      <div className="change-actions">
                        <button
                          onClick={() => handleAcceptChange(change.id)}
                          className="btn btn-sm btn-success"
                        >
                          Accept
                        </button>
                        <button
                          onClick={() => handleRejectChange(change.id)}
                          className="btn btn-sm btn-danger"
                        >
                          Reject
                        </button>
                      </div>
                    )}
                  </div>
                  {change.attributes && (
                    <div className="change-attributes">
                      Formatting: {JSON.stringify(change.attributes)}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Example Content */}
        <div className="examples">
          <h2>Try These Examples:</h2>
          <div className="example-buttons">
            <button
              onClick={() => {
                editorRef.current?.setContent('This is a basic text insertion.');
              }}
              className="btn btn-outline"
            >
              Basic Text
            </button>
            <button
              onClick={() => {
                editorRef.current?.setContent(
                  'This is **bold** and *italic* text with `code`.'
                );
              }}
              className="btn btn-outline"
            >
              Formatted Text
            </button>
            <button
              onClick={() => {
                editorRef.current?.setContent(
                  '# Heading 1\n## Heading 2\n- List item 1\n- List item 2'
                );
              }}
              className="btn btn-outline"
            >
              Markdown
            </button>
            <button
              onClick={() => {
                editorRef.current?.setContent(
                  'Special characters: 你好 👋 🌍\nEmojis and Unicode'
                );
              }}
              className="btn btn-outline"
            >
              Special Characters
            </button>
          </div>
        </div>

        <style>{`
          .track-changes-demo {
            padding: 1rem;
          }

          .demo-container {
            max-width: 1200px;
            margin: 0 auto;
          }

          h1 {
            font-size: 2rem;
            font-weight: bold;
            margin-bottom: 1rem;
          }

          h2 {
            font-size: 1.5rem;
            font-weight: 600;
            margin-bottom: 0.5rem;
          }

          .user-selection {
            margin-bottom: 1rem;
          }

          .user-selection label {
            margin-right: 0.5rem;
          }

          .user-selection select {
            padding: 0.5rem;
            border: 1px solid #ccc;
            border-radius: 4px;
          }

          .editor-container {
            border: 1px solid #ccc;
            border-radius: 4px;
            overflow: hidden;
            margin-bottom: 1rem;
          }

          .change-controls {
            display: flex;
            gap: 0.5rem;
            margin-bottom: 1rem;
          }

          .btn {
            padding: 0.5rem 1rem;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            font-weight: 500;
            transition: background-color 0.2s;
          }

          .btn:hover {
            opacity: 0.9;
          }

          .btn-primary {
            background-color: #3b82f6;
            color: white;
          }

          .btn-success {
            background-color: #22c55e;
            color: white;
          }

          .btn-danger {
            background-color: #ef4444;
            color: white;
          }

          .btn-outline {
            background-color: transparent;
            border: 1px solid #ccc;
          }

          .btn-outline:hover {
            background-color: #f3f4f6;
          }

          .btn-sm {
            padding: 0.25rem 0.5rem;
            font-size: 0.875rem;
          }

          .changes-list {
            margin-top: 1rem;
          }

          .changes-container {
            border: 1px solid #ccc;
            border-radius: 4px;
            padding: 1rem;
            max-height: 300px;
            overflow-y: auto;
          }

          .change-item {
            margin-bottom: 0.5rem;
            padding: 0.5rem;
            border-radius: 4px;
          }

          .change-item.pending {
            background-color: #f3f4f6;
          }

          .change-item.accepted {
            background-color: #dcfce7;
          }

          .change-item.rejected {
            background-color: #fee2e2;
          }

          .change-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
          }

          .change-info {
            display: flex;
            align-items: center;
            gap: 0.5rem;
          }

          .author {
            font-weight: 600;
          }

          .separator {
            color: #6b7280;
          }

          .text {
            color: #4b5563;
          }

          .change-actions {
            display: flex;
            gap: 0.5rem;
          }

          .change-attributes {
            font-size: 0.875rem;
            color: #6b7280;
            margin-top: 0.25rem;
          }

          .examples {
            margin-top: 2rem;
          }

          .example-buttons {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 1rem;
          }
        `}</style>
      </div>
    </div>
  );
};

export default TrackChangesDemo; 