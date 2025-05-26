import React from 'react';
import Quill from 'quill';

interface ToolbarProps {
  quill: any;
  className?: string;
}

export const Toolbar: React.FC<ToolbarProps> = ({ quill, className = '' }) => {
  const handleFormat = (format: string, value: any) => {
    const range = quill.getSelection();
    if (range) {
      quill.format(format, value);
    }
  };

  const handleList = (type: 'bullet' | 'ordered') => {
    const range = quill.getSelection();
    if (range) {
      const format = quill.getFormat(range);
      if (format.list === type) {
        quill.format('list', false);
      } else {
        quill.format('list', type);
      }
    }
  };

  const handleHeading = (level: number) => {
    const range = quill.getSelection();
    if (range) {
      const format = quill.getFormat(range);
      if (format.header === level) {
        quill.format('header', false);
      } else {
        quill.format('header', level);
      }
    }
  };

  return (
    <div className={`flex flex-wrap gap-2 p-2 border-b ${className}`}>
      {/* Text Formatting */}
      <div className="flex gap-2">
        <button
          onClick={() => handleFormat('bold', !quill.getFormat()?.bold)}
          className="p-2 hover:bg-gray-100 rounded"
          title="Bold (Ctrl+B)"
        >
          <strong>B</strong>
        </button>
        <button
          onClick={() => handleFormat('italic', !quill.getFormat()?.italic)}
          className="p-2 hover:bg-gray-100 rounded"
          title="Italic (Ctrl+I)"
        >
          <em>I</em>
        </button>
        <button
          onClick={() => handleFormat('underline', !quill.getFormat()?.underline)}
          className="p-2 hover:bg-gray-100 rounded"
          title="Underline (Ctrl+U)"
        >
          <u>U</u>
        </button>
      </div>

      {/* Headings */}
      <div className="flex gap-2">
        <button
          onClick={() => handleHeading(1)}
          className="p-2 hover:bg-gray-100 rounded"
          title="Heading 1 (Ctrl+1)"
        >
          H1
        </button>
        <button
          onClick={() => handleHeading(2)}
          className="p-2 hover:bg-gray-100 rounded"
          title="Heading 2 (Ctrl+2)"
        >
          H2
        </button>
      </div>

      {/* Lists */}
      <div className="flex gap-2">
        <button
          onClick={() => handleList('bullet')}
          className="p-2 hover:bg-gray-100 rounded"
          title="Bullet List (Ctrl+L)"
        >
          • List
        </button>
        <button
          onClick={() => handleList('ordered')}
          className="p-2 hover:bg-gray-100 rounded"
          title="Numbered List (Ctrl+O)"
        >
          1. List
        </button>
      </div>

      {/* Alignment */}
      <div className="flex gap-2">
        <button
          onClick={() => handleFormat('align', 'left')}
          className="p-2 hover:bg-gray-100 rounded"
          title="Align Left"
        >
          ←
        </button>
        <button
          onClick={() => handleFormat('align', 'center')}
          className="p-2 hover:bg-gray-100 rounded"
          title="Align Center"
        >
          ↔
        </button>
        <button
          onClick={() => handleFormat('align', 'right')}
          className="p-2 hover:bg-gray-100 rounded"
          title="Align Right"
        >
          →
        </button>
      </div>

      {/* Text Color */}
      <div className="flex gap-2">
        <input
          type="color"
          onChange={(e) => handleFormat('color', e.target.value)}
          className="w-8 h-8 p-0 border-0"
          title="Text Color"
        />
        <input
          type="color"
          onChange={(e) => handleFormat('background', e.target.value)}
          className="w-8 h-8 p-0 border-0"
          title="Background Color"
        />
      </div>

      {/* Link */}
      <div className="flex gap-2">
        <button
          onClick={() => {
            const url = prompt('Enter URL:');
            if (url) {
              handleFormat('link', url);
            }
          }}
          className="p-2 hover:bg-gray-100 rounded"
          title="Insert Link"
        >
          🔗
        </button>
      </div>

      {/* Image */}
      <div className="flex gap-2">
        <button
          onClick={() => {
            const url = prompt('Enter image URL:');
            if (url) {
              const range = quill.getSelection();
              quill.insertEmbed(range.index, 'image', url);
            }
          }}
          className="p-2 hover:bg-gray-100 rounded"
          title="Insert Image"
        >
          🖼️
        </button>
      </div>

      {/* Code Block */}
      <div className="flex gap-2">
        <button
          onClick={() => handleFormat('code-block', !quill.getFormat()?.codeBlock)}
          className="p-2 hover:bg-gray-100 rounded"
          title="Code Block"
        >
          {'</>'}
        </button>
      </div>
    </div>
  );
}; 