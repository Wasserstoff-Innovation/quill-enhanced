# @wasserstoff/quill-enhanced

A powerful, feature-rich WYSIWYG editor SDK built on top of Quill. This SDK provides a modular and extensible foundation for building rich text editors with advanced features like markdown support, track changes, and more.

## Features

- 🎨 Rich text editing with Quill
- 📝 Markdown support
- 🔄 Track changes
- 💾 Autosave
- 📊 Line numbers
- 📤 Export to PDF, Word, HTML, and Markdown
- ⌨️ Customizable keyboard shortcuts
- 🧩 Plugin system for extensibility

## Installation

```bash
npm install @wasserstoff/quill-enhanced
# or
yarn add @wasserstoff/quill-enhanced
```

## Quick Start

```tsx
import { Editor, Toolbar } from '@wasserstoff/quill-enhanced';

function MyEditor() {
  return (
    <div>
      <Toolbar />
      <Editor
        defaultValue="Start typing..."
        onChange={(delta) => console.log('Content changed:', delta)}
      />
    </div>
  );
}
```

## Core Components

### Editor

The main editor component that provides the core editing functionality.

```tsx
import { Editor } from '@wasserstoff/quill-enhanced';

<Editor
  defaultValue="Initial content"
  onChange={(delta) => console.log('Content changed:', delta)}
  readOnly={false}
  theme="snow"
/>
```

### Toolbar

A customizable toolbar for formatting options.

```tsx
import { Toolbar } from '@wasserstoff/quill-enhanced';

<Toolbar
  formats={['bold', 'italic', 'underline']}
  onFormatChange={(format) => console.log('Format changed:', format)}
/>
```

## Plugins

### Track Changes

Enable change tracking in your editor.

```tsx
import { Editor, TrackChangesPlugin } from '@wasserstoff/quill-enhanced';

<Editor
  plugins={[
    new TrackChangesPlugin({
      onChangesTracked: (changes) => console.log('Changes:', changes)
    })
  ]}
/>
```

### Markdown

Add markdown support to your editor.

```tsx
import { Editor, MarkdownPlugin } from '@wasserstoff/quill-enhanced';

<Editor
  plugins={[
    new MarkdownPlugin({
      onMarkdownChange: (markdown) => console.log('Markdown:', markdown)
    })
  ]}
/>
```

### Autosave

Automatically save content changes.

```tsx
import { Editor, AutosavePlugin } from '@wasserstoff/quill-enhanced';

<Editor
  plugins={[
    new AutosavePlugin({
      interval: 5000, // Save every 5 seconds
      onSave: (content) => console.log('Content saved:', content)
    })
  ]}
/>
```

## Utilities

### Delta Operations

```typescript
import { createDelta, createTextDelta, mergeDeltas } from '@wasserstoff/quill-enhanced';

const delta1 = createTextDelta('Hello');
const delta2 = createTextDelta(' World');
const merged = mergeDeltas([delta1, delta2]);
```

### Export

```typescript
import { exportToPDF, exportToWord, exportToHTML, exportToMarkdown } from '@wasserstoff/quill-enhanced';

// Export to PDF
await exportToPDF(delta, 'document.pdf');

// Export to Word
await exportToWord(delta, 'document.docx');

// Export to HTML
const html = exportToHTML(delta);

// Export to Markdown
const markdown = exportToMarkdown(delta);
```

### Diff

```typescript
import { getDiff, applyDiff, formatDiff } from '@wasserstoff/quill-enhanced';

const diff = getDiff(oldDelta, newDelta);
const formatted = formatDiff(diff);
const applied = applyDiff(original, diff);
```

## Keyboard Shortcuts

```typescript
import { registerKeyboardShortcut, unregisterKeyboardShortcut } from '@wasserstoff/quill-enhanced';

// Register a shortcut
registerKeyboardShortcut('ctrl+b', () => {
  // Toggle bold
});

// Unregister a shortcut
unregisterKeyboardShortcut('ctrl+b');
```

## Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

## License

MIT © [Wasserstoff](https://github.com/wasserstoff)
