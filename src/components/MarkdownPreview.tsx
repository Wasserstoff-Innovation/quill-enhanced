import React from 'react';
import { markdownToHtml } from '../utils/markdownUtils';

interface MarkdownPreviewProps {
  content: string;
  className?: string;
}

export const MarkdownPreview: React.FC<MarkdownPreviewProps> = ({
  content,
  className = ''
}) => {
  const html = markdownToHtml(content);

  return (
    <div 
      data-testid="markdown-preview"
      className={`markdown-preview ${className}`}
      dangerouslySetInnerHTML={{ __html: html }}
      style={{
        padding: '1rem',
        backgroundColor: '#fff',
        borderRadius: '4px',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
        minHeight: '200px',
        overflow: 'auto'
      }}
    />
  );
}; 