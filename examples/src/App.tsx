import React, { useState, useCallback } from 'react';
// import SimpleEditor from './SimpleEditor';
import EnhancedEditor from './EnhancedEditor';
import Notification from './Notification';
import './App.css';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'overview' | 'basic' | 'advanced' | 'docs'>('overview');
  const [editorContent, setEditorContent] = useState('');
  const [notification, setNotification] = useState<{message: string, type: 'success' | 'error' | 'info'} | null>(null);
  const [copyButtonState, setCopyButtonState] = useState<'normal' | 'copied'>('normal');

  const handleEditorChange = useCallback((content: string) => {
    setEditorContent(content);
  }, []);

  const showNotification = useCallback((message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setNotification({ message, type });
  }, []);

  const exportToHTML = () => {
    const blob = new Blob([editorContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'document.html';
    a.click();
    URL.revokeObjectURL(url);
    showNotification('HTML file downloaded successfully!');
  };

  const copyContent = () => {
    navigator.clipboard.writeText(editorContent);
    setCopyButtonState('copied');
    showNotification('Content copied to clipboard!');
    setTimeout(() => setCopyButtonState('normal'), 2000);
  };

  const handleExport = useCallback((format: string, content: string) => {
    switch (format) {
      case 'html':
        const htmlBlob = new Blob([content], { type: 'text/html' });
        const htmlUrl = URL.createObjectURL(htmlBlob);
        const htmlLink = document.createElement('a');
        htmlLink.href = htmlUrl;
        htmlLink.download = 'document.html';
        htmlLink.click();
        URL.revokeObjectURL(htmlUrl);
        showNotification('HTML exported successfully!');
        break;
      case 'pdf':
        showNotification('PDF export feature coming soon!', 'info');
        break;
      case 'docx':
        showNotification('DOCX export feature coming soon!', 'info');
        break;
      default:
        showNotification('Export format not supported', 'error');
    }
  }, [showNotification]);

  return (
    <div className="app">
      {/* Header */}
      <header className="header">
        <div className="container">
          <div className="header-content">
            <div className="logo">
              <img src="/src/logo.png" alt="Wasserstoff" className="logo-image" />
              <div>
                <h1>Wasserstoff</h1>
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
                className={`nav-btn ${activeTab === 'basic' ? 'active' : ''}`}
                onClick={() => setActiveTab('basic')}
              >
                Live Demo
              </button>
              <button 
                className={`nav-btn ${activeTab === 'advanced' ? 'active' : ''}`}
                onClick={() => setActiveTab('advanced')}
              >
                Advanced Demo
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
                  <button className="btn btn-primary" onClick={() => setActiveTab('basic')}>
                    Try Live Demo
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

          {activeTab === 'basic' && (
            <div className="demo-section">
              <h2>Live Editor Demo</h2>
              <p>Experience the power of our WYSIWYG editor with essential formatting tools and intuitive interface.</p>
              
              <div className="editor-container">
                <EnhancedEditor
                  initialContent="<h1>Welcome to Wasserstoff Quill Enhanced!</h1><p>This is a <strong>live demo</strong> of our WYSIWYG editor. Try the following features:</p><ul><li>Format text with <em>bold</em>, <u>underline</u>, and other styles</li><li>Create headers and lists</li><li>Add links and blockquotes</li><li>Change colors and alignment</li></ul><p>Start editing to see the magic happen! ✨</p>"
                  placeholder="Start typing to experience the editor..."
                  onChange={handleEditorChange}
                />
              </div>

              <div className="demo-controls">
                <button className="btn btn-primary" onClick={exportToHTML}>
                  📄 Export HTML
                </button>
                <button 
                  className={`btn btn-secondary ${copyButtonState === 'copied' ? 'btn-copied' : ''}`} 
                  onClick={copyContent}
                >
                  📋 Copy Content
                </button>
              </div>

              {editorContent && (
                <div className="content-preview">
                  <h3>Live Content Preview:</h3>
                  <pre><code>{editorContent}</code></pre>
                </div>
              )}
            </div>
          )}

          {activeTab === 'advanced' && (
            <div className="demo-section">
              <h2>Advanced Editor Demo</h2>
              <p>Explore the full potential with track changes, autosave, line numbers, and collaborative features.</p>
              
              <EnhancedEditor
                placeholder="Experience all the advanced features..."
                onChange={handleEditorChange}
                onExport={handleExport}
              />

              {editorContent && (
                <div className="content-preview">
                  <h3>Live Content Preview:</h3>
                  <pre><code>{editorContent}</code></pre>
                </div>
              )}
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
                  <pre><code>{`import React from 'react';
import { EnhancedEditor } from '@wasserstoff/quill-enhanced';

function MyApp() {
  return (
    <EnhancedEditor
      initialContent="Hello World!"
      placeholder="Start typing..."
      onChange={(content) => console.log(content)}
    />
  );
}`}</code></pre>
                </section>

                <section className="doc-section">
                  <h3>🔥 Advanced Features</h3>
                  <pre><code>{`import React from 'react';
import { EnhancedEditor } from '@wasserstoff/quill-enhanced';

function AdvancedApp() {
  return (
    <EnhancedEditor
      initialContent="Hello World!"
      placeholder="Start typing..."
      onChange={(content) => console.log(content)}
      onExport={(format, content) => {
        // Handle export
        console.log(\`Exporting as \${format}\`);
      }}
    />
  );
}`}</code></pre>
                </section>

                <section className="doc-section">
                  <h3>🔧 API Reference</h3>
                  <div className="api-table">
                    <h4>EnhancedEditor Props</h4>
                    <table>
                      <thead>
                        <tr>
                          <th>Prop</th>
                          <th>Type</th>
                          <th>Description</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td>initialContent</td>
                          <td>string</td>
                          <td>Initial HTML content for the editor</td>
                        </tr>
                        <tr>
                          <td>placeholder</td>
                          <td>string</td>
                          <td>Placeholder text when editor is empty</td>
                        </tr>
                        <tr>
                          <td>onChange</td>
                          <td>(content: string) =&gt; void</td>
                          <td>Callback when content changes</td>
                        </tr>
                        <tr>
                          <td>onExport</td>
                          <td>(format: string, content: string) =&gt; void</td>
                          <td>Callback when content is exported</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
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