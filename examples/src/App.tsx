import React, { useState } from 'react';
import { Editor } from '@wasserstoff/quill-enhanced';
// import '../../src/components/Editor.css';
import './App.css';
import { PlaygroundLayout } from './components/PlaygroundLayout';

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
        {activeTab === 'overview' && (
          <div className="container">
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
          </div>
        )}

        {activeTab === 'playground' && (
          <PlaygroundLayout />
        )}

        {activeTab === 'docs' && (
          <div className="container">
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
                
                <section className="doc-section">
                  <h3>🔌 Plugin System</h3>
                  <pre><code>{`// Using plugins programmatically
import { TrackChangesPlugin, AutosavePlugin, LineNumbersPlugin } from '@wasserstoff/quill-enhanced';

// Initialize plugins
const trackChanges = new TrackChangesPlugin(quill, {
  enabled: true,
  currentUser: 'user-id',
  onChangesUpdate: (changes) => console.log(changes)
});

const autosave = new AutosavePlugin(quill, {
  enabled: true,
  interval: 5000,
  documentId: 'doc-123',
  onSave: (content) => saveToServer(content)
});

const lineNumbers = new LineNumbersPlugin(quill, {
  enabled: true
});`}
                  </code></pre>
                </section>

                <section className="doc-section">
                  <h3>📤 Export Features</h3>
                  <pre><code>{`import { exportToPDF, exportToDocx, deltaToMarkdown } from '@wasserstoff/quill-enhanced';

// Export to different formats
const content = editor.getContent();

// PDF Export
exportToPDF(content, 'document.pdf');

// DOCX Export
await exportToDocx(content, 'document.docx');

// Markdown Export
const markdown = deltaToMarkdown(content);

// HTML Export
const html = editor.exportHTML();`}
                  </code></pre>
                </section>
              </div>
            </div>
          </div>
        )}
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