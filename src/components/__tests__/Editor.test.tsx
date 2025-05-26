import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import Editor, { EditorRef } from '../Editor';
import { jest } from '@jest/globals';

// Mock all dependencies
jest.mock('quill', () => {
  const mockQuillInstance = {
    on: jest.fn(),
    off: jest.fn(),
    getContents: jest.fn().mockReturnValue({ ops: [{ insert: '\n' }] }),
    setContents: jest.fn(),
    getText: jest.fn().mockReturnValue(''),
    setText: jest.fn(),
    getSelection: jest.fn().mockReturnValue({ index: 0, length: 0 }),
    setSelection: jest.fn(),
    getFormat: jest.fn().mockReturnValue({}),
    format: jest.fn(),
    focus: jest.fn(),
    blur: jest.fn(),
    enable: jest.fn(),
    disable: jest.fn(),
    isEnabled: jest.fn().mockReturnValue(true),
    root: { innerHTML: '<p>Test content</p>' },
    clipboard: { dangerouslyPasteHTML: jest.fn() }
  };

  const MockQuill = jest.fn().mockImplementation(() => mockQuillInstance);
  (MockQuill as any).import = jest.fn().mockReturnValue(class MockDelta {
    ops: any[] = [];
    constructor(ops: any[] = []) { this.ops = ops; }
  });

  return MockQuill;
});

jest.mock('../../plugins/TrackChanges', () => ({
  TrackChanges: jest.fn().mockImplementation(() => ({
    acceptAllChanges: jest.fn(),
    rejectAllChanges: jest.fn(),
    getChanges: jest.fn().mockReturnValue([]),
    getPendingChanges: jest.fn().mockReturnValue([]),
    acceptChange: jest.fn(),
    rejectChange: jest.fn(),
    clearChanges: jest.fn(),
    updateOptions: jest.fn()
  }))
}));

jest.mock('../../plugins/Autosave', () => ({ AutosavePlugin: jest.fn() }));
jest.mock('../../plugins/LineNumbers', () => ({ LineNumbersPlugin: jest.fn() }));
jest.mock('../../utils/keyboardShortcuts', () => ({ KeyboardShortcutsManager: jest.fn() }));
jest.mock('../../utils/exportUtils', () => ({
  exportToDocx: jest.fn(),
  exportToPDF: jest.fn()
}));
jest.mock('../../utils/markdownUtils', () => ({
  deltaToMarkdown: jest.fn().mockReturnValue(''),
  fromMarkdown: jest.fn().mockReturnValue({ ops: [] })
}));

describe('Editor Component', () => {
  let editorRef: React.RefObject<EditorRef>;

  beforeEach(() => {
    editorRef = React.createRef();
  });

  it('renders without crashing', () => {
    render(<Editor ref={editorRef} />);
    expect(screen.getByText('Export DOCX')).toBeInTheDocument();
  });

  it('initializes with default props', () => {
    render(<Editor ref={editorRef} />);
    expect(editorRef.current).toBeTruthy();
  });

  it('handles track changes functionality', () => {
    render(<Editor ref={editorRef} trackChanges currentUser="test-user" />);
    expect(editorRef.current?.getChanges()).toEqual([]);
    expect(editorRef.current?.getPendingChanges()).toEqual([]);
  });

  it('handles export functionality', () => {
    render(<Editor ref={editorRef} />);
    expect(editorRef.current?.exportHTML()).toContain('<p>');
    expect(editorRef.current?.exportMarkdown().trim()).toBe('');
  });

  it('handles basic editor operations', () => {
    render(<Editor ref={editorRef} />);
    expect(editorRef.current?.getText().trim()).toBe('');
    expect(editorRef.current?.getSelection()).toEqual({ index: 0, length: 0 });
    expect(editorRef.current?.getFormat()).toEqual({});
    expect(editorRef.current?.isEnabled()).toBe(true);
  });
}); 