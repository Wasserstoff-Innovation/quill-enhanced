import React, { useState, useRef } from 'react';
import { Editor, EditorRef, Toolbar, MarkdownPreview } from '../../../src';
import { FeaturePanel } from './FeaturePanel';
import { CodePanel } from './CodePanel';
import './PlaygroundLayout.css';

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

const defaultConfig: PlaygroundConfig = {
  showToolbar: true,
  toolbarOptions: ['bold', 'italic', 'underline', 'header', 'list', 'link'],
  placeholder: 'Start typing your content...',
  readOnly: false,
  showLineNumbers: false,
  trackChanges: false,
  autosave: false,
  autosaveInterval: 5000,
  enableMarkdown: false,
  enablePdfExport: true,
  enableDocxExport: true,
  enableHtmlExport: true,
  enableMarkdownExport: true,
  currentUser: 'demo-user',
  enableComments: false,
  enableRealTimeSync: false,
  theme: 'light',
  customCss: ''
};

export const PlaygroundLayout: React.FC = () => {
  const [config, setConfig] = useState<PlaygroundConfig>(defaultConfig);
  const [editorContent, setEditorContent] = useState('');
  const [viewMode, setViewMode] = useState<'editor' | 'code'>('editor');
  const [activeFeatures, setActiveFeatures] = useState<Record<string, boolean>>({});
  const editorRef = useRef<EditorRef>(null);

  const handleConfigChange = (newConfig: Partial<PlaygroundConfig>) => {
    setConfig(prev => ({ ...prev, ...newConfig }));
  };

  const handleEditorChange = (content: any) => {
    setEditorContent(content);
  };

  const handleExport = (format: 'docx' | 'pdf') => {
    if (editorRef.current) {
      if (format === 'docx') {
        editorRef.current.exportDocx();
      } else {
        editorRef.current.exportPDF();
      }
    }
  };

  const handleUndo = () => {
    if (editorRef.current) {
      editorRef.current.undo();
    }
  };

  const handleRedo = () => {
    if (editorRef.current) {
      editorRef.current.redo();
    }
  };

  const generateCode = () => {
    const imports = [
      "import { Editor } from '@wasserstoff/quill-enhanced';",
      "import '@wasserstoff/quill-enhanced/dist/index.css';"
    ];

    const props: string[] = [];
    
    if (config.placeholder !== defaultConfig.placeholder) {
      props.push(`  placeholder=\"${config.placeholder}\"`);
    }
    
    if (config.readOnly) {
      props.push(`  readOnly={${config.readOnly}}`);
    }
    
    if (config.showLineNumbers) {
      props.push(`  showLineNumbers={${config.showLineNumbers}}`);
    }
    
    if (config.trackChanges) {
      props.push(`  trackChanges={${config.trackChanges}}`);
      props.push(`  currentUser=\"${config.currentUser}\"`);
    }
    
    if (config.autosave) {
      props.push(`  autosave={${config.autosave}}`);
      if (config.autosaveInterval !== defaultConfig.autosaveInterval) {
        props.push(`  autosaveInterval={${config.autosaveInterval}}`);
      }
    }
    
    if (config.enableMarkdown) {
      props.push(`  enableMarkdown={${config.enableMarkdown}}`);
    }

    const component = `<Editor\n${props.join('\n')}\n  onChange={handleChange}\n  onSave={handleSave}\n/>`;

    return {
      imports: imports.join('\n'),
      component,
      fullExample: `${imports.join('\n')}\n\nfunction MyEditor() {\n  const handleChange = (content) => {\n    console.log('Content changed:', content);\n  };\n\n  const handleSave = (content) => {\n    console.log('Content saved:', content);\n  };\n\n  return (\n    ${component}\n  );\n}`
    };
  };

  return (
    <div className="playground-layout no-bg">
      <div className="playground-content compact">
        <div className="playground-left compact">
          <FeaturePanel 
            config={config} 
            onConfigChange={handleConfigChange}
          />
        </div>
        <div className="playground-right compact">
          <div className="playground-editor">
            <div className="editor-toolbar-top">
              <button
                className={`editor-toggle-btn${viewMode === 'editor' ? ' active' : ''}`}
                onClick={() => setViewMode('editor')}
              >
                Editor
              </button>
              <button
                className={`editor-toggle-btn${viewMode === 'code' ? ' active' : ''}`}
                onClick={() => setViewMode('code')}
              >
                Code
              </button>
            </div>
            {viewMode === 'editor' ? (
              <>
                {config.showToolbar && editorRef.current && (
                  <Toolbar 
                    quill={editorRef.current}
                    onExport={handleExport}
                    onUndo={handleUndo}
                    onRedo={handleRedo}
                  />
                )}
                {config.enableMarkdown ? (
                  <MarkdownPreview content={editorContent} />
                ) : (
                  <Editor
                    ref={editorRef}
                    placeholder={config.placeholder}
                    readOnly={config.readOnly}
                    showLineNumbers={config.showLineNumbers}
                    trackChanges={config.trackChanges}
                    currentUser={config.currentUser}
                    autosave={config.autosave}
                    autosaveInterval={config.autosaveInterval}
                    enableMarkdown={config.enableMarkdown}
                    onChange={handleEditorChange}
                    initialContent="<h1>Welcome to the Advanced Playground!</h1><p>This editor updates in real-time based on your configuration. Try changing the settings on the left to see how they affect the editor behavior.</p><p>You can format text with <strong>bold</strong>, <em>italic</em>, and <u>underline</u> styles.</p>"
                  />
                )}
              </>
            ) : (
              <div className="editor-code-panel-inplace">
                <CodePanel code={generateCode()} config={config} />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}; 