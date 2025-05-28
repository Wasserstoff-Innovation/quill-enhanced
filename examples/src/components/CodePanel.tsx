import React, { useState } from 'react';
import './CodePanel.css';

interface PlaygroundConfig {
  // Core Features
  showToolbar: boolean;
  toolbarOptions: string[];
  placeholder: string;
  readOnly: boolean;
  
  // Advanced Features
  showLineNumbers: boolean;
  trackChanges: boolean;
  autosave: boolean;
  autosaveInterval: number;
  enableMarkdown: boolean;
  
  // Export Features
  enablePdfExport: boolean;
  enableDocxExport: boolean;
  enableHtmlExport: boolean;
  enableMarkdownExport: boolean;
  
  // Collaboration Features
  currentUser: string;
  enableComments: boolean;
  enableRealTimeSync: boolean;
  
  // Styling
  theme: 'light' | 'dark';
  customCss: string;
}

interface CodeData {
  imports: string;
  component: string;
  fullExample: string;
}

interface CodePanelProps {
  code: CodeData;
  config: PlaygroundConfig;
}

export const CodePanel: React.FC<CodePanelProps> = ({ code, config }) => {
  const [activeTab, setActiveTab] = useState<'component' | 'full' | 'plugins'>('component');
  const [copyStatus, setCopyStatus] = useState<string>('');

  const handleCopy = async (text: string, type: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopyStatus(`${type} copied!`);
      setTimeout(() => setCopyStatus(''), 2000);
    } catch (err) {
      setCopyStatus('Failed to copy');
      setTimeout(() => setCopyStatus(''), 2000);
    }
  };

  const generatePluginExamples = () => {
    const examples: string[] = [];

    if (config.trackChanges) {
      examples.push(`// Track Changes Plugin
import { TrackChangesPlugin } from '@wasserstoff/quill-enhanced';

const trackChangesPlugin = new TrackChangesPlugin(quill, {
  enabled: true,
  currentUser: '${config.currentUser}',
  onChangesUpdate: (changes) => {
    console.log('Changes:', changes);
  }
});

// Accept/Reject changes
trackChangesPlugin.acceptAllChanges();
trackChangesPlugin.rejectAllChanges();`);
    }

    if (config.autosave) {
      examples.push(`// Autosave Plugin
import { AutosavePlugin } from '@wasserstoff/quill-enhanced';

const autosavePlugin = new AutosavePlugin(quill, {
  enabled: true,
  interval: ${config.autosaveInterval},
  documentId: 'my-document',
  onSave: (content, draftId) => {
    console.log('Auto-saved:', draftId);
  },
  onError: (error) => {
    console.error('Autosave error:', error);
  }
});`);
    }

    if (config.showLineNumbers) {
      examples.push(`// Line Numbers Plugin
import { LineNumbersPlugin } from '@wasserstoff/quill-enhanced';

const lineNumbersPlugin = new LineNumbersPlugin(quill, {
  enabled: true
});`);
    }

    if (config.enableMarkdown) {
      examples.push(`// Markdown Plugin
import { MarkdownPlugin } from '@wasserstoff/quill-enhanced';

const markdownPlugin = new MarkdownPlugin(quill, {
  enabled: true
});

// Convert to/from markdown
import { deltaToMarkdown, fromMarkdown } from '@wasserstoff/quill-enhanced';
const markdown = deltaToMarkdown(quill.getContents());
const delta = fromMarkdown(markdownText);`);
    }

    return examples.join('\n\n');
  };

  const generateExportExamples = () => {
    const exports: string[] = [];

    if (config.enablePdfExport) {
      exports.push(`// Export to PDF
import { exportToPDF } from '@wasserstoff/quill-enhanced';
exportToPDF(quill.getContents(), 'document.pdf');`);
    }

    if (config.enableDocxExport) {
      exports.push(`// Export to DOCX
import { exportToDocx } from '@wasserstoff/quill-enhanced';
await exportToDocx(quill.getContents(), 'document.docx');`);
    }

    if (config.enableHtmlExport) {
      exports.push(`// Export to HTML
const html = quill.root.innerHTML;`);
    }

    if (config.enableMarkdownExport) {
      exports.push(`// Export to Markdown
import { deltaToMarkdown } from '@wasserstoff/quill-enhanced';
const markdown = deltaToMarkdown(quill.getContents());`);
    }

    return exports.join('\n\n');
  };

  const getTabContent = () => {
    switch (activeTab) {
      case 'component':
        return code.component;
      case 'full':
        return code.fullExample;
      case 'plugins':
        const pluginExamples = generatePluginExamples();
        const exportExamples = generateExportExamples();
        return `${code.imports}

// Plugin Examples
${pluginExamples}

// Export Examples
${exportExamples}`;
      default:
        return code.component;
    }
  };

  return (
    <div className="code-panel">
      <div className="code-panel-header">
        <h3>📋 Generated Code</h3>
        <div className="code-tabs">
          <button
            className={`tab ${activeTab === 'component' ? 'active' : ''}`}
            onClick={() => setActiveTab('component')}
          >
            Component
          </button>
          <button
            className={`tab ${activeTab === 'full' ? 'active' : ''}`}
            onClick={() => setActiveTab('full')}
          >
            Full Example
          </button>
          <button
            className={`tab ${activeTab === 'plugins' ? 'active' : ''}`}
            onClick={() => setActiveTab('plugins')}
          >
            Plugins & Export
          </button>
        </div>
        <button
          className="copy-button"
          onClick={() => handleCopy(getTabContent(), activeTab)}
        >
          {copyStatus || 'Copy Code'}
        </button>
      </div>
      
      <div className="code-content">
        <pre>
          <code className="language-tsx">
            {getTabContent()}
          </code>
        </pre>
      </div>
      
      <div className="code-panel-footer">
        <div className="installation-info">
          <h4>📦 Installation</h4>
          <div className="install-commands">
            <code>npm install @wasserstoff/quill-enhanced</code>
            <button
              className="copy-install"
              onClick={() => handleCopy('npm install @wasserstoff/quill-enhanced', 'Install command')}
            >
              Copy
            </button>
          </div>
        </div>
        
        <div className="feature-summary">
          <h4>✨ Active Features</h4>
          <div className="active-features">
            {config.showLineNumbers && <span className="feature-tag">Line Numbers</span>}
            {config.trackChanges && <span className="feature-tag">Track Changes</span>}
            {config.autosave && <span className="feature-tag">Autosave</span>}
            {config.enableMarkdown && <span className="feature-tag">Markdown</span>}
            {config.readOnly && <span className="feature-tag">Read Only</span>}
            {!config.showLineNumbers && !config.trackChanges && !config.autosave && !config.enableMarkdown && !config.readOnly && (
              <span className="feature-tag default">Basic Editor</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}; 