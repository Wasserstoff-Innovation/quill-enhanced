import React, { useState, useRef } from 'react';
import {
  Bold,
  Italic,
  Underline,
  Heading1,
  Heading2,
  List,
  ListOrdered,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Code,
  Quote,
  Undo2,
  Redo2,
  Link,
  Image,
  Palette,
  Highlighter,
  Download,
  CheckCircle,
  XCircle
} from 'lucide-react';

interface ToolbarProps {
  quill: any;
  className?: string;
  onExport?: (format: 'docx' | 'pdf') => void;
  onUndo?: () => void;
  onRedo?: () => void;
}

export const Toolbar: React.FC<ToolbarProps> = ({ quill, className = '', onExport, onUndo, onRedo }) => {
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showBgColorPicker, setShowBgColorPicker] = useState(false);
  const [showDownloadMenu, setShowDownloadMenu] = useState(false);
  const colorInputRef = useRef<HTMLInputElement>(null);
  const bgColorInputRef = useRef<HTMLInputElement>(null);

  const handleFormat = (format: string, value: any) => {
    if (!quill) return;
    const range = quill.getSelection();
    if (range) {
      const currentFormat = quill.getFormat(range) || {};
      // Toggle the format if it's already applied
      if (currentFormat[format] === value || (currentFormat[format] && typeof value === 'boolean')) {
        quill.format(format, false);
      } else {
        quill.format(format, value);
      }
    } else {
      // If no selection, apply to cursor position
      quill.format(format, value);
    }
  };

  const handleList = (type: 'bullet' | 'ordered') => {
    if (!quill) return;
    const range = quill.getSelection();
    if (range) {
      const format = quill.getFormat(range) || {};
      if (format.list === type) {
        quill.format('list', false);
      } else {
        quill.format('list', type);
      }
    }
  };

  const handleHeading = (level: number) => {
    if (!quill) return;
    const range = quill.getSelection();
    if (range) {
      const format = quill.getFormat(range) || {};
      if (format.header === level) {
        quill.format('header', false);
      } else {
        quill.format('header', level);
      }
    }
  };

  const handleAlignment = (align: string) => {
    if (!quill) return;
    const range = quill.getSelection();
    if (range) {
      const format = quill.getFormat(range) || {};
      if (format.align === align) {
        quill.format('align', false);
      } else {
        quill.format('align', align);
      }
    }
  };

  const handleColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const color = e.target.value;
    handleFormat('color', color);
    setShowColorPicker(false);
  };

  const handleBgColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const color = e.target.value;
    handleFormat('background', color);
    setShowBgColorPicker(false);
  };

  const handleColorClick = () => {
    if (colorInputRef.current) {
      colorInputRef.current.click();
    }
  };

  const handleBgColorClick = () => {
    if (bgColorInputRef.current) {
      bgColorInputRef.current.click();
    }
  };

  const handleLinkClick = () => {
    const url = prompt('Enter URL:');
    if (url) {
      const range = quill.getSelection();
      if (range && range.length > 0) {
        quill.format('link', url);
      } else {
        const text = prompt('Enter link text:') || url;
        if (range) {
          quill.insertText(range.index, text, 'link', url);
          quill.setSelection(range.index + text.length);
        }
      }
    }
  };

  const handleImageClick = () => {
    const url = prompt('Enter image URL:');
    if (url) {
      const range = quill.getSelection();
      if (range) {
        quill.insertEmbed(range.index, 'image', url);
        if (quill.setSelection) {
          quill.setSelection(range.index + 1);
        }
      }
    }
  };

  const handleDownloadClick = () => {
    setShowDownloadMenu(!showDownloadMenu);
  };

  const handleExportClick = (format: 'docx' | 'pdf') => {
    setShowDownloadMenu(false);
    onExport?.(format);
  };

  // Get current format safely
  const getCurrentFormat = () => {
    if (!quill) return {};
    const range = quill.getSelection();
    if (range) {
      return quill.getFormat(range) || {};
    }
    return {};
  };

  if (!quill) {
    return <div className={`editor-toolbar-container ${className}`.trim()}>
      <div className="editor-toolbar-loading">Loading toolbar...</div>
    </div>;
  }

  const currentFormat = getCurrentFormat();

  return (
    <div className={`editor-toolbar-container ${className}`.trim()}>
      <div className="editor-toolbar-row">
        {/* Text Styles */}
        <div className="editor-toolbar-group">
          <button title="Bold (Ctrl+B)" className={currentFormat.bold ? 'active toolbar-button' : 'toolbar-button'} onClick={() => handleFormat('bold', true)}><Bold size={20} /></button>
          <button title="Italic (Ctrl+I)" className={currentFormat.italic ? 'active toolbar-button' : 'toolbar-button'} onClick={() => handleFormat('italic', true)}><Italic size={20} /></button>
          <button title="Underline (Ctrl+U)" className={currentFormat.underline ? 'active toolbar-button' : 'toolbar-button'} onClick={() => handleFormat('underline', true)}><Underline size={20} /></button>
        </div>
        <div className="editor-toolbar-divider" />
        {/* Headings */}
        <div className="editor-toolbar-group">
          <button title="Heading 1" className={currentFormat.header === 1 ? 'active toolbar-button' : 'toolbar-button'} onClick={() => handleHeading(1)}><Heading1 size={20} /></button>
          <button title="Heading 2" className={currentFormat.header === 2 ? 'active toolbar-button' : 'toolbar-button'} onClick={() => handleHeading(2)}><Heading2 size={20} /></button>
        </div>
        <div className="editor-toolbar-divider" />
        {/* Lists */}
        <div className="editor-toolbar-group">
          <button title="Numbered List" className={currentFormat.list === 'ordered' ? 'active toolbar-button' : 'toolbar-button'} onClick={() => handleList('ordered')}><ListOrdered size={20} /></button>
          <button title="Bullet List" className={currentFormat.list === 'bullet' ? 'active toolbar-button' : 'toolbar-button'} onClick={() => handleList('bullet')}><List size={20} /></button>
        </div>
        <div className="editor-toolbar-divider" />
        {/* Alignment */}
        <div className="editor-toolbar-group">
          <button title="Align Left" className={!currentFormat.align || currentFormat.align === 'left' ? 'active toolbar-button' : 'toolbar-button'} onClick={() => handleAlignment('left')}><AlignLeft size={20} /></button>
          <button title="Align Center" className={currentFormat.align === 'center' ? 'active toolbar-button' : 'toolbar-button'} onClick={() => handleAlignment('center')}><AlignCenter size={20} /></button>
          <button title="Align Right" className={currentFormat.align === 'right' ? 'active toolbar-button' : 'toolbar-button'} onClick={() => handleAlignment('right')}><AlignRight size={20} /></button>
        </div>
        <div className="editor-toolbar-divider" />
        {/* Blockquote, Code */}
        <div className="editor-toolbar-group">
          <button title="Blockquote" className={currentFormat.blockquote ? 'active toolbar-button' : 'toolbar-button'} onClick={() => handleFormat('blockquote', true)}><Quote size={20} /></button>
          <button title="Code Block" className={currentFormat['code-block'] ? 'active toolbar-button' : 'toolbar-button'} onClick={() => handleFormat('code-block', true)}><Code size={20} /></button>
        </div>
        <div className="editor-toolbar-divider" />
        {/* Undo/Redo */}
        <div className="editor-toolbar-group">
          <button title="Undo" className="toolbar-button" onClick={onUndo}><Undo2 size={20} /></button>
          <button title="Redo" className="toolbar-button" onClick={onRedo}><Redo2 size={20} /></button>
        </div>
        <div className="editor-toolbar-divider" />
        {/* Insertions */}
        <div className="editor-toolbar-group">
          <button title="Insert Link" className="toolbar-button" onClick={handleLinkClick}><Link size={20} /></button>
          <button title="Insert Image" className="toolbar-button" onClick={handleImageClick}><Image size={20} /></button>
        </div>
        <div className="editor-toolbar-divider" />
        {/* Colors */}
        <div className="editor-toolbar-group">
          <button title="Text Color" className="toolbar-button" onClick={handleColorClick}><Palette size={20} /></button>
          <input ref={colorInputRef} type="color" onChange={handleColorChange} style={{ display: 'none' }} title="Text Color" />
          <button title="Highlight" className="toolbar-button" onClick={handleBgColorClick}><Highlighter size={20} /></button>
          <input ref={bgColorInputRef} type="color" onChange={handleBgColorChange} style={{ display: 'none' }} title="Background Color" />
        </div>
        <div className="editor-toolbar-divider" />
        {/* Export */}
        <div className="editor-toolbar-group">
          <button title="Download" className="toolbar-button" onClick={handleDownloadClick}><Download size={20} /></button>
          {showDownloadMenu && (
            <div className="download-menu">
              <button onClick={() => handleExportClick('docx')}><CheckCircle size={16} /> Export as DOCX</button>
              <button onClick={() => handleExportClick('pdf')}><XCircle size={16} /> Export as PDF</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}; 