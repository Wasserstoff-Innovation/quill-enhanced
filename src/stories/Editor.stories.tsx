import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import Editor from '../components/Editor';

const meta: Meta<typeof Editor> = {
  title: 'Editor',
  component: Editor,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof Editor>;

// Basic editor
export const Basic: Story = {
  args: {
    initialContent: '<p>Hello, World!</p>',
  },
};

// With track changes
export const TrackChanges: Story = {
  args: {
    trackChanges: true,
    currentUser: 'john.doe',
    initialContent: '<p>Original content</p>',
  },
};

// With markdown support
export const Markdown: Story = {
  args: {
    enableMarkdown: true,
    initialContent: '# Hello\n\nThis is **markdown** content.',
  },
};

// With line numbers
export const LineNumbers: Story = {
  args: {
    showLineNumbers: true,
    initialContent: '<p>Line 1</p><p>Line 2</p><p>Line 3</p>',
  },
};

// With autosave
export const Autosave: Story = {
  args: {
    autosave: true,
    autosaveInterval: 2000,
    initialContent: '<p>This content will be autosaved every 2 seconds.</p>',
  },
};

// Read-only mode
export const ReadOnly: Story = {
  args: {
    readOnly: true,
    initialContent: '<p>This content cannot be edited.</p>',
  },
};

// With custom toolbar
export const CustomToolbar: Story = {
  args: {
    initialContent: '<p>Editor with custom toolbar</p>',
    toolbar: {
      container: [
        ['bold', 'italic', 'underline'],
        [{ 'color': [] }, { 'background': [] }],
        [{ 'align': [] }],
        ['clean']
      ],
    },
  },
};

// With all features
export const FullFeatured: Story = {
  args: {
    trackChanges: true,
    currentUser: 'john.doe',
    showLineNumbers: true,
    enableMarkdown: true,
    autosave: true,
    initialContent: `
      <h1>Full Featured Editor</h1>
      <p>This editor includes:</p>
      <ul>
        <li>Track changes</li>
        <li>Line numbers</li>
        <li>Markdown support</li>
        <li>Autosave</li>
      </ul>
    `,
  },
};

// With custom header
export const CustomHeader: Story = {
  args: {
    header: <div className="bg-gray-100 p-4">Custom Header</div>,
    initialContent: '<p>Editor with custom header</p>',
  },
};

// With custom margins
export const CustomMargins: Story = {
  args: {
    marginLeft: '2in',
    marginRight: '2in',
    marginTop: '1in',
    initialContent: '<p>Editor with custom margins</p>',
  },
};

// With custom placeholder
export const CustomPlaceholder: Story = {
  args: {
    placeholder: 'Start typing your content here...',
    initialContent: '',
  },
};

// With custom save handler
export const CustomSaveHandler: Story = {
  args: {
    autosave: true,
    onSave: (content) => {
      console.log('Content saved:', content);
      // Simulate API call
      return new Promise((resolve) => setTimeout(resolve, 1000));
    },
    initialContent: '<p>Editor with custom save handler</p>',
  },
};

// With custom change handler
export const CustomChangeHandler: Story = {
  args: {
    onContentChange: (delta) => {
      console.log('Content changed:', delta);
      // Simulate processing
      return new Promise((resolve) => setTimeout(resolve, 500));
    },
    initialContent: '<p>Editor with custom change handler</p>',
  },
};

// With custom metadata
export const CustomMetadata: Story = {
  args: {
    documentId: 'doc-123',
    metadata: {
      author: 'John Doe',
      createdAt: new Date().toISOString(),
      tags: ['document', 'example'],
    },
    initialContent: '<p>Editor with custom metadata</p>',
  },
};

// With custom version
export const CustomVersion: Story = {
  args: {
    version: 2,
    initialContent: '<p>Editor with custom version</p>',
  },
};

// With custom className
export const CustomClassName: Story = {
  args: {
    className: 'custom-editor',
    initialContent: '<p>Editor with custom class</p>',
  },
};

// With custom toolbar and header
export const CustomToolbarAndHeader: Story = {
  args: {
    header: <div className="bg-gray-100 p-4">Custom Header</div>,
    toolbar: {
      container: [
        ['bold', 'italic', 'underline'],
        [{ 'color': [] }, { 'background': [] }],
        [{ 'align': [] }],
        ['clean']
      ],
    },
    initialContent: '<p>Editor with custom toolbar and header</p>',
  },
}; 