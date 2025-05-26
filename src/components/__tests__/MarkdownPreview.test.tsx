import { jest } from '@jest/globals';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { MarkdownPreview } from '../MarkdownPreview';

// Mock marked
jest.mock('marked', () => ({
  marked: jest.fn((markdown: string) => {
    // Simple markdown to HTML conversion for testing
    return markdown
      .replace(/^# (.+)$/gm, '<h1>$1</h1>')
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.+?)\*/g, '<em>$1</em>')
      .replace(/^- (.+)$/gm, '<li>$1</li>')
      .replace(/(<li>.*<\/li>)/s, '<ul>$1</ul>')
      .replace(/\n/g, '<br>');
  }),
  setOptions: jest.fn()
}));

// Mock DOMPurify
jest.mock('dompurify', () => ({
  sanitize: jest.fn((html: string) => html)
}));

describe('MarkdownPreview Component', () => {
  it('renders basic markdown content', () => {
    const content = '# Title\n\nThis is a **bold** paragraph.';
    render(<MarkdownPreview content={content} />);
    
    expect(screen.getByText('Title')).toBeInTheDocument();
    expect(screen.getByText(/This is a/)).toBeInTheDocument();
    // Check for bold text without specific styling
    expect(screen.getByText('bold')).toBeInTheDocument();
  });

  it('renders lists correctly', () => {
    const content = '- Item 1\n- Item 2\n- Item 3';
    render(<MarkdownPreview content={content} />);
    
    expect(screen.getByText('Item 1')).toBeInTheDocument();
    expect(screen.getByText('Item 2')).toBeInTheDocument();
    expect(screen.getByText('Item 3')).toBeInTheDocument();
  });

  it('renders code blocks', () => {
    const content = '```javascript\nconst x = 1;\n```';
    render(<MarkdownPreview content={content} />);
    
    expect(screen.getByText(/const x = 1/)).toBeInTheDocument();
  });

  it('handles empty content', () => {
    render(<MarkdownPreview content="" />);
    const previewElement = screen.getByTestId('markdown-preview');
    expect(previewElement).toBeEmptyDOMElement();
  });

  it('renders links correctly', () => {
    const content = '[Link text](https://example.com)';
    render(<MarkdownPreview content={content} />);
    
    expect(screen.getByText('Link text')).toBeInTheDocument();
  });

  it('applies custom className', () => {
    const content = '# Test';
    render(<MarkdownPreview content={content} className="custom-class" />);
    
    const previewElement = screen.getByTestId('markdown-preview');
    expect(previewElement).toHaveClass('custom-class');
  });
}); 