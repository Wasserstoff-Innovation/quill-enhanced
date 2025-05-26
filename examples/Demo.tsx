import React, { useRef, useState } from 'react';
import {
  Editor,
  EditorRef,
  Delta,
  createDelta,
  EDITOR_MODES,
  type EditorMode
} from '@wasserstoff/quill-enhanced';

const Demo: React.FC = () => {
  const editorRef = useRef<EditorRef>(null);
  const [mode, setMode] = useState<EditorMode>(EDITOR_MODES.WYSIWYG);
  const [showDiff, setShowDiff] = useState(false);
  const [currentUser, setCurrentUser] = useState('john.doe');
  const [showLineNumbers, setShowLineNumbers] = useState(false);
  const [autosave, setAutosave] = useState(false);
  const [readOnly, setReadOnly] = useState(false);
  const [content, setContent] = useState<Delta | null>(null);

  const handleExport = async (format: 'docx' | 'pdf') => {
    if (!editorRef.current) return;
    
    try {
      if (format === 'docx') {
        await editorRef.current.exportDocx();
      } else {
        await editorRef.current.exportPDF();
      }
    } catch (error) {
      console.error(`Export to ${format} failed:`, error);
    }
  };

  const handleContentChange = (delta: Delta) => {
    setContent(delta);
  };

  const handleSave = (content: any) => {
    console.log('Content saved:', content);
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold text-gray-900">Quill Enhanced Demo</h1>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="bg-white shadow rounded-lg p-6">
            <div className="mb-6 flex flex-wrap gap-4">
              <button
                onClick={() => setMode(mode === EDITOR_MODES.WYSIWYG ? EDITOR_MODES.MARKDOWN : EDITOR_MODES.WYSIWYG)}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                Toggle {mode === EDITOR_MODES.WYSIWYG ? 'Markdown' : 'WYSIWYG'}
              </button>

              <button
                onClick={() => setShowDiff(!showDiff)}
                className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
              >
                {showDiff ? 'Hide' : 'Show'} Changes
              </button>

              <button
                onClick={() => setShowLineNumbers(!showLineNumbers)}
                className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600"
              >
                {showLineNumbers ? 'Hide' : 'Show'} Line Numbers
              </button>

              <button
                onClick={() => setAutosave(!autosave)}
                className="px-4 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600"
              >
                {autosave ? 'Disable' : 'Enable'} Autosave
              </button>

              <button
                onClick={() => setReadOnly(!readOnly)}
                className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
              >
                {readOnly ? 'Enable' : 'Disable'} Editing
              </button>

              <button
                onClick={() => handleExport('docx')}
                className="px-4 py-2 bg-indigo-500 text-white rounded hover:bg-indigo-600"
              >
                Export DOCX
              </button>

              <button
                onClick={() => handleExport('pdf')}
                className="px-4 py-2 bg-indigo-500 text-white rounded hover:bg-indigo-600"
              >
                Export PDF
              </button>
            </div>

            <div className="border rounded-lg overflow-hidden">
              <Editor
                ref={editorRef}
                initialContent={createDelta([
                  { insert: 'Welcome to Quill Enhanced\n', attributes: { header: 1 } },
                  { insert: 'This is a demo of the enhanced Quill editor with the following features:\n' },
                  { insert: '• Rich text editing\n• Markdown support\n• Track changes\n• Line numbers\n• Autosave\n• Export to DOCX and PDF\n', attributes: { list: 'bullet' } },
                  { insert: 'Try out the different features using the buttons above!\n' }
                ])}
                trackChanges={true}
                currentUser={currentUser}
                showLineNumbers={showLineNumbers}
                enableMarkdown={mode === EDITOR_MODES.MARKDOWN}
                autosave={autosave}
                readOnly={readOnly}
                onContentChange={handleContentChange}
                onSave={handleSave}
                className="h-[600px]"
              />
            </div>

            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
              <h2 className="text-lg font-semibold mb-2">Current Content</h2>
              <pre className="bg-gray-100 p-4 rounded overflow-auto max-h-40">
                {JSON.stringify(content, null, 2)}
              </pre>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Demo; 