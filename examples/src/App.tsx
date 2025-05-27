import React, { useState } from 'react';
import { Editor } from '../../src';
// import '../../src/components/Editor.css';
import './App.css';

// Custom Notification Component
const Notification: React.FC<{ message: string; type: string; onClose: () => void }> = ({ message, type, onClose }) => {
  return (
    <div className={`notification ${type}`}>
      <p>{message}</p>
      <button onClick={onClose}>Close</button>
    </div>
  );
};

const App: React.FC = () => {
  const [content, setContent] = useState<string>('');
  const [showLineNumbers, setShowLineNumbers] = useState<boolean>(true);
  const [trackChanges, setTrackChanges] = useState<boolean>(true);
  const [autosave, setAutosave] = useState<boolean>(true);
  const [enableMarkdown, setEnableMarkdown] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<string>('overview');
  const [editorContent, setEditorContent] = useState<string>('');
  const [copyButtonState, setCopyButtonState] = useState<string>('Copy');
  const [notification, setNotification] = useState<{ message: string; type: string } | null>(null);

  const handleChange = (delta: any) => {
    setContent(delta);
  };

  const toggleLineNumbers = () => {
    setShowLineNumbers(!showLineNumbers);
  };

  const toggleMarkdown = () => {
    setEnableMarkdown(!enableMarkdown);
  };

  const toggleTrackChanges = () => {
    setTrackChanges(!trackChanges);
  };

  const toggleAutosave = () => {
    setAutosave(!autosave);
  };

  const handleEditorChange = (content: string) => {
    setEditorContent(content);
  };

  const exportToHTML = () => {
    // Logic to export content to HTML
    console.log('Exporting to HTML:', editorContent);
  };

  const copyContent = () => {
    navigator.clipboard.writeText(editorContent).then(() => {
      setCopyButtonState('Copied!');
      setTimeout(() => setCopyButtonState('Copy'), 2000);
    });
  };

  return (
    <div className="app">
      {/* Header */}
      <header className="header">
        <div className="container">
          <div className="header-content">
            <div className="logo">
              <img src="/src/logo.png" alt="Wasserstoff" className="logo-image" />
              <div>
                <span className="logo-subtitle">Quill Enhanced SDK</span>
              </div>
            </div>
            <nav className="nav">
              <button 
                className={`nav-btn ${activeTab === 'overview' ? 'active' : ''}`}
                onClick={() => setActiveTab('overview')}
              >
                Overview
              </button>
              <button 
                className={`nav-btn ${activeTab === 'playground' ? 'active' : ''}`}
                onClick={() => setActiveTab('playground')}
              >
                Playground
              </button>
              <button 
                className={`nav-btn ${activeTab === 'docs' ? 'active' : ''}`}
                onClick={() => setActiveTab('docs')}
              >
                Documentation
              </button>
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="main">
        <div className="container">
          {activeTab === 'overview' && (
            <div className="overview">
              <div className="hero">
                <h2>Professional WYSIWYG Editor SDK</h2>
                <p>Built on top of Quill with advanced features for modern applications. Create rich, collaborative editing experiences with track changes, autosave, and powerful export capabilities.</p>
                <div className="hero-buttons">
                  <button className="btn btn-primary" onClick={() => setActiveTab('playground')}>
                    Try Playground
                  </button>
                  <button className="btn btn-secondary" onClick={() => setActiveTab('docs')}>
                    View Documentation
                  </button>
                </div>
              </div>

              <div className="features-grid">
                <div className="feature-card">
                  <div className="feature-icon">📝</div>
                  <h3>Rich Text Editing</h3>
                  <p>Full-featured WYSIWYG editor with comprehensive formatting options, lists, links, images, and media support. Built on the robust Quill.js foundation.</p>
                </div>
                <div className="feature-card">
                  <div className="feature-icon">🔄</div>
                  <h3>Track Changes</h3>
                  <p>Real-time change tracking with accept/reject functionality for collaborative editing. Perfect for document review workflows and team collaboration.</p>
                </div>
                <div className="feature-card">
                  <div className="feature-icon">💾</div>
                  <h3>Intelligent Autosave</h3>
                  <p>Smart autosave with conflict resolution, draft management, and version control. Never lose your work with automatic backup and recovery.</p>
                </div>
                <div className="feature-card">
                  <div className="feature-icon">📄</div>
                  <h3>Export Capabilities</h3>
                  <p>Export to PDF, DOCX, Markdown, and HTML with full formatting preservation. Seamless integration with your existing document workflows.</p>
                </div>
                <div className="feature-card">
                  <div className="feature-icon">🔌</div>
                  <h3>Plugin Architecture</h3>
                  <p>Extensible plugin system for custom functionality and integrations. Build custom features that fit your specific use cases and requirements.</p>
                </div>
                <div className="feature-card">
                  <div className="feature-icon">⚡</div>
                  <h3>TypeScript Ready</h3>
                  <p>Full TypeScript support with comprehensive type definitions. Enjoy excellent developer experience with IntelliSense and type safety.</p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'playground' && (
            <div className="demo-section">
              <h2>Playground</h2>
              <p>Try all advanced features and see the code to use the SDK in your app.</p>
              <div className="playground-main">
                <div className="playground-editor">
                  <Editor
                    initialContent="<h1>Welcome to Wasserstoff Quill Enhanced!</h1><p>This is a <strong>playground</strong> for our WYSIWYG editor. Try the following features:</p><ul><li>Format text with <em>bold</em>, <u>underline</u>, and other styles</li><li>Create headers and lists</li><li>Add links and blockquotes</li><li>Change colors and alignment</li></ul><p>Start editing to see the magic happen! ✨</p>"
                    placeholder="Experience all the advanced features..."
                    showLineNumbers={showLineNumbers}
                    trackChanges={trackChanges}
                    autosave={autosave}
                    enableMarkdown={enableMarkdown}
                    onChange={setContent}
                  />
                </div>
                <div className="playground-code">
                  <h3>How to use in your app</h3>
                  <pre>{`
import { Editor } from '@wasserstoff/quill-enhanced';
import '@wasserstoff/quill-enhanced/dist/index.css';

<Editor
  initialContent={...}
  placeholder="..."
  showLineNumbers={${showLineNumbers}}
  trackChanges={${trackChanges}}
  autosave={${autosave}}
  enableMarkdown={${enableMarkdown}}
  onChange={...}
/>
                  `}</pre>
                  <div className="playground-toggles">
                    <label><input type="checkbox" checked={showLineNumbers} onChange={() => setShowLineNumbers(v => !v)} /> Show Line Numbers</label>
                    <label><input type="checkbox" checked={trackChanges} onChange={() => setTrackChanges(v => !v)} /> Track Changes</label>
                    <label><input type="checkbox" checked={autosave} onChange={() => setAutosave(v => !v)} /> Autosave</label>
                    <label><input type="checkbox" checked={enableMarkdown} onChange={() => setEnableMarkdown(v => !v)} /> Markdown</label>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'docs' && (
            <div className="docs-section">
              <h2>Documentation</h2>
              <div className="docs-content">
                <section className="doc-section">
                  <h3>🚀 Quick Start</h3>
                  <pre><code>npm install @wasserstoff/quill-enhanced

# Peer dependencies
npm install react react-dom quill</code></pre>
                </section>
                <section className="doc-section">
                  <h3>📝 Basic Usage</h3>
                  <pre><code>{`import { Editor } from '@wasserstoff/quill-enhanced';
import '@wasserstoff/quill-enhanced/dist/index.css';

function MyApp() {
  return (
    <Editor
      initialContent={content}
      documentId="demo-doc"
      showLineNumbers={showLineNumbers}
      enableMarkdown={enableMarkdown}
      trackChanges={trackChanges}
      autosave={autosave}
      onChange={handleChange}
    />
  );
};`}
                  </code></pre>
                </section>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="footer">
        <div className="container">
          <p>© 2024 Wasserstoff. All rights reserved.</p>
        </div>
      </footer>

      {/* Notification */}
      {notification && (
        <Notification
          message={notification.message}
          type={notification.type}
          onClose={() => setNotification(null)}
        />
      )}
    </div>
  );
};

export default App; 