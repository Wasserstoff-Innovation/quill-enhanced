import React, { useState, useRef } from 'react';
import { Editor, EditorRef, MarkdownPreview } from '../../../src';
import { FeaturePanel } from './FeaturePanel';
import { CodePanel } from './CodePanel';
import './PlaygroundLayout.css';

interface PlaygroundConfig {
  showToolbar: boolean;
  enableMarkdown: boolean;
  readOnly: boolean;
  toolbarOptions: string[];
  placeholder: string;
  showLineNumbers: boolean;
  trackChanges: boolean;
  currentUser: string;
  autosave: boolean;
  autosaveInterval: number;
  customCss: string;
  enablePdfExport: boolean;
  enableDocxExport: boolean;
  enableHtmlExport: boolean;
  enableMarkdownExport: boolean;
  enableComments: boolean;
  enableRealTimeSync: boolean;
  theme: 'light' | 'dark';
}

interface PlaygroundLayoutProps {
  defaultConfig?: Partial<PlaygroundConfig>;
}

export const PlaygroundLayout: React.FC<PlaygroundLayoutProps> = ({ 
  defaultConfig = {
    showToolbar: true,
    enableMarkdown: false,
    readOnly: false,
    toolbarOptions: [],
    placeholder: '',
    showLineNumbers: false,
    trackChanges: false,
    currentUser: 'demo-user',
    autosave: false,
    autosaveInterval: 5000,
    customCss: '',
    enablePdfExport: true,
    enableDocxExport: true,
    enableHtmlExport: true,
    enableMarkdownExport: true,
    enableComments: false,
    enableRealTimeSync: false,
    theme: 'light'
  }
}) => {
  const [config, setConfig] = useState<PlaygroundConfig>({
    showToolbar: true,
    enableMarkdown: false,
    readOnly: false,
    toolbarOptions: [],
    placeholder: '',
    showLineNumbers: false,
    trackChanges: false,
    currentUser: 'demo-user',
    autosave: false,
    autosaveInterval: 5000,
    customCss: '',
    enablePdfExport: true,
    enableDocxExport: true,
    enableHtmlExport: true,
    enableMarkdownExport: true,
    enableComments: false,
    enableRealTimeSync: false,
    theme: 'light',
    ...defaultConfig
  });
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

  const handleExport = (format: 'docx' | 'pdf' | 'html' | 'markdown') => {
    if (editorRef.current) {
      switch (format) {
        case 'docx':
          editorRef.current.exportDocx();
          break;
        case 'pdf':
          editorRef.current.exportPDF();
          break;
        case 'html':
          // Handle HTML export
          const content = editorRef.current.getContent();
          console.log('HTML content:', content);
          break;
        case 'markdown':
          // Handle Markdown export
          const markdownContent = editorRef.current.getContent();
          console.log('Markdown content:', markdownContent);
          break;
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
                    showToolbar={config.showToolbar}
                    theme={config.theme}
                    exportOptions={{
                      enablePdfExport: config.enablePdfExport,
                      enableDocxExport: config.enableDocxExport,
                      enableHtmlExport: config.enableHtmlExport,
                      enableMarkdownExport: config.enableMarkdownExport
                    }}
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