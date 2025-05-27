# 🚀 Wasserstoff Quill Enhanced

[![npm version](https://badge.fury.io/js/@wasserstoff%2Fquill-enhanced.svg)](https://badge.fury.io/js/@wasserstoff%2Fquill-enhanced)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/%3C%2F%3E-TypeScript-%230074c1.svg)](http://www.typescriptlang.org/)

A professional, feature-rich WYSIWYG editor SDK built on top of [Quill](https://quilljs.com/) with advanced capabilities for modern web applications.

## 🙏 Credits & Acknowledgments

This project is built on top of the excellent [Quill Rich Text Editor](https://github.com/slab/quill), originally created by **Jason Chen** and **Byron Milligan**, and actively maintained by [Slab](https://slab.com/). We extend our gratitude to the Quill team and the entire open-source community for their foundational work that makes this enhanced SDK possible.

- **Original Quill Editor**: [https://github.com/slab/quill](https://github.com/slab/quill)
- **Quill Documentation**: [https://quilljs.com/](https://quilljs.com/)
- **License**: Quill is licensed under BSD 3-Clause License

## ✨ Features

- 📝 **Rich Text Editing** - Full-featured WYSIWYG editor with formatting, lists, links, and media support
- 🔄 **Track Changes** - Real-time change tracking with accept/reject functionality for collaborative editing
- 💾 **Autosave** - Intelligent autosave with conflict resolution and draft management
- 📄 **Export Options** - Export to PDF, DOCX, Markdown, and HTML with full formatting preservation
- 🔌 **Plugin Architecture** - Extensible plugin system with built-in plugins for enhanced functionality
- ⚡ **TypeScript** - Full TypeScript support with comprehensive type definitions
- 🎨 **Customizable** - Dark/light themes and customizable UI components
- 📱 **Responsive** - Mobile-friendly design with touch support
- 🔍 **Table of Contents** - Automatic TOC generation from document headings
- 📊 **Line Numbers** - Optional line numbering for code-like editing experience
- 🎯 **Performance Optimized** - Virtual scrolling, memory management, and operation batching
- 🔧 **Advanced API** - Selection manipulation, custom actions, and programmatic highlighting

## 🚀 Quick Start

### Installation

```bash
npm install @wasserstoff/quill-enhanced
```

### Peer Dependencies

Make sure you have the required peer dependencies installed:

```bash
npm install react react-dom quill
```

### Basic Usage

```tsx
import React from 'react';
import { Editor } from '@wasserstoff/quill-enhanced';

function MyApp() {
  return (
    <Editor
      initialContent="Hello World!"
      documentId="my-doc"
      placeholder="Start typing..."
      onChange={(delta) => console.log(delta)}
    />
  );
}
```

### Advanced Usage with Plugins

```tsx
import React, { useRef } from 'react';
import { Editor, EditorRef } from '@wasserstoff/quill-enhanced';

function AdvancedApp() {
  const editorRef = useRef<EditorRef>(null);

  const handleSave = (content: any) => {
    // Save to your backend
    console.log('Saving:', content);
  };

  const exportToPDF = () => {
    editorRef.current?.exportPDF();
  };

  return (
    <div>
      <Editor
        ref={editorRef}
        initialContent="Advanced example with plugins"
        documentId="advanced-doc"
        trackChanges={true}
        currentUser="user-123"
        autosave={true}
        showLineNumbers={true}
        enableMarkdown={true}
        onSave={handleSave}
        onChangesUpdate={(changes) => console.log('Changes:', changes)}
      />
      <button onClick={exportToPDF}>Export PDF</button>
    </div>
  );
}
```

## 📖 API Reference

### Editor Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `initialContent` | `string \| Delta` | `""` | Initial content for the editor |
| `documentId` | `string` | `"default"` | Unique identifier for the document |
| `trackChanges` | `boolean` | `false` | Enable change tracking |
| `currentUser` | `string` | `"anonymous"` | Current user for change tracking |
| `autosave` | `boolean` | `false` | Enable autosave functionality |
| `autosaveInterval` | `number` | `30000` | Autosave interval in milliseconds |
| `showLineNumbers` | `boolean` | `false` | Show line numbers |
| `enableMarkdown` | `boolean` | `false` | Enable markdown support |
| `placeholder` | `string` | `""` | Placeholder text |
| `readOnly` | `boolean` | `false` | Make editor read-only |
| `onChange` | `(delta: Delta) => void` | - | Content change callback |
| `onSave` | `(content: any) => void` | - | Save callback |
| `onChangesUpdate` | `(changes: Change[]) => void` | - | Changes update callback |

### Editor Methods

```tsx
const editorRef = useRef<EditorRef>(null);

// Content methods
const content = editorRef.current?.getContent('delta'); // 'delta' | 'html' | 'text' | 'markdown'
editorRef.current?.setContent(content, 'delta');

// Export methods
editorRef.current?.exportPDF();
editorRef.current?.exportDocx();
editorRef.current?.exportHTML();
editorRef.current?.exportMarkdown();

// Track changes methods
editorRef.current?.acceptChange(changeId);
editorRef.current?.rejectChange(changeId);
editorRef.current?.acceptAllChanges();
editorRef.current?.rejectAllChanges();

// Selection and highlighting
editorRef.current?.highlightRange(start, length, className);
editorRef.current?.getSelectedText();
editorRef.current?.replaceText(index, length, text);

// Editor control
editorRef.current?.focus();
editorRef.current?.blur();
editorRef.current?.enable();
editorRef.current?.disable();
```

## 🔌 Plugins

### Built-in Plugins

- **AutosavePlugin** - Automatic saving with draft management and conflict resolution
- **TrackChangesPlugin** - Change tracking and collaboration with accept/reject functionality
- **LineNumbersPlugin** - Line number display for code-like editing
- **MarkdownPlugin** - Markdown import/export support with real-time conversion
- **TableOfContentsPlugin** - Dynamic TOC generation with navigation

### Using Plugins Directly

```tsx
import { 
  AutosavePlugin, 
  TrackChangesPlugin, 
  LineNumbersPlugin,
  TableOfContentsPlugin 
} from '@wasserstoff/quill-enhanced';

// Plugins are automatically loaded based on props
// Or use them directly with the core editor
const autosave = new AutosavePlugin(quill, {
  interval: 30000,
  onSave: (content) => saveToServer(content)
});

const trackChanges = new TrackChangesPlugin(quill, {
  currentUser: 'user-123',
  onChangesUpdate: (changes) => handleChanges(changes)
});
```

## 🎨 Theming

The editor supports both light and dark themes with customizable CSS variables:

```css
:root {
  --editor-bg: #ffffff;
  --editor-text: #000000;
  --editor-border: #e1e5e9;
  --toolbar-bg: #f8f9fa;
  --line-number-bg: #f8f9fa;
  --line-number-text: #6c757d;
}

[data-theme="dark"] {
  --editor-bg: #1f2937;
  --editor-text: #e4e4e7;
  --editor-border: #374151;
  --toolbar-bg: #111111;
  --line-number-bg: #374151;
  --line-number-text: #9ca3af;
}
```

## 📦 Export Formats

### PDF Export
```tsx
// Basic PDF export
editorRef.current?.exportPDF();

// With custom options
await exportToPDF(content, {
  filename: 'my-document.pdf',
  format: 'a4',
  margin: { top: 20, right: 20, bottom: 20, left: 20 }
});
```

### DOCX Export
```tsx
// Basic DOCX export
editorRef.current?.exportDocx();

// With custom options
await exportToDocx(content, {
  filename: 'my-document.docx',
  creator: 'Your App',
  title: 'Document Title'
});
```

### Markdown Export
```tsx
// Get as markdown string
const markdown = editorRef.current?.getContent('markdown');

// Export as file
const markdown = exportToMarkdown(content);
```

### HTML Export
```tsx
// Get as HTML string
const html = editorRef.current?.getContent('html');

// Export as file
await exportToHTML(content, 'my-document.html');
```

## 🔄 Track Changes

Enable collaborative editing with real-time change tracking:

```tsx
<Editor
  trackChanges={true}
  currentUser="user-123"
  onChangesUpdate={(changes) => {
    // Handle changes
    changes.forEach(change => {
      console.log(`${change.author} ${change.type}d: ${change.text}`);
    });
  }}
/>
```

### Change Management

```tsx
// Accept/reject individual changes
editorRef.current?.acceptChange(changeId);
editorRef.current?.rejectChange(changeId);

// Bulk operations
editorRef.current?.acceptAllChanges();
editorRef.current?.rejectAllChanges();

// Get all changes
const changes = editorRef.current?.getChanges();
const pendingChanges = editorRef.current?.getPendingChanges();
```

## 💾 Autosave

Intelligent autosave with conflict resolution:

```tsx
<Editor
  autosave={true}
  autosaveInterval={30000} // 30 seconds
  documentId="unique-doc-id"
  onSave={(content, draftId) => {
    console.log('Auto-saved:', draftId);
  }}
/>
```

### Draft Management

The editor automatically handles:
- Saving drafts to localStorage/IndexedDB
- Conflict detection between tabs
- Draft recovery on page reload
- Cleanup of old drafts

```tsx
// Manual draft operations
editorRef.current?.clearDraft();
const drafts = editorRef.current?.getDrafts();
const stats = editorRef.current?.getStorageStats();
```

## 📊 Table of Contents

Automatic TOC generation from document headings:

```tsx
import { TableOfContentsPlugin } from '@wasserstoff/quill-enhanced';

// Enable TOC in editor
<Editor
  plugins={[TableOfContentsPlugin]}
  // ... other props
/>

// Or use directly
const toc = new TableOfContentsPlugin(quill, {
  levels: [1, 2, 3], // H1, H2, H3
  container: '#toc-container'
});
```

## 🎯 Performance Features

### Virtual Scrolling
Handles large documents efficiently with virtual scrolling for optimal performance.

### Memory Management
- Automatic cleanup of event listeners
- Object pooling for memory efficiency
- Performance monitoring and optimization

### Operation Batching
- DOM operation batching for better performance
- Debounced and throttled operations
- Optimized rendering pipeline

## 🛠️ Development

### Setup

```bash
git clone https://github.com/wasserstoff/quill-enhanced.git
cd quill-enhanced
npm install
```

### Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run test         # Run tests
npm run demo         # Start demo application
npm run lint         # Run linting
npm run typecheck    # Type checking
```

### Demo

Run the demo to see all features in action:

```bash
npm run demo
```

Visit `http://localhost:5173` to explore the interactive demo.

## 📄 License

MIT © [Wasserstoff](https://github.com/wasserstoff-innovation)

## 🤝 Contributing

Contributions are welcome! Please read our [Contributing Guide](CONTRIBUTING.md) for details.

## 📞 Support

- 📧 Email: support@wasserstoff.com
- 🐛 Issues: [GitHub Issues](https://github.com/Wasserstoff-Innovation/quill-enhanced/issues)
- 📖 Docs: [Documentation](https://wasserstoff.github.io/quill-enhanced)

---

Built with ❤️ by the Wasserstoff team, powered by [Quill](https://quilljs.com/).
