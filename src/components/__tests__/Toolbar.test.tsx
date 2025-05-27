import React from 'react';
import { render, fireEvent, screen } from '@testing-library/react';
import { Toolbar } from '../Toolbar';
import { jest } from '@jest/globals';

describe('Toolbar', () => {
  let mockQuill: any;

  beforeEach(() => {
    mockQuill = {
      getSelection: jest.fn(),
      getFormat: jest.fn(),
      format: jest.fn(),
      insertEmbed: jest.fn(),
      history: {
        undo: jest.fn(),
        redo: jest.fn()
      }
    };
  });

  describe('Text Formatting', () => {
    it('should toggle bold formatting', () => {
      mockQuill.getSelection.mockReturnValue({ index: 0, length: 5 });
      mockQuill.getFormat.mockReturnValue({ bold: false });

      render(<Toolbar quill={mockQuill} />);
      fireEvent.click(screen.getByTitle('Bold (Ctrl+B)'));

      expect(mockQuill.format).toHaveBeenCalledWith('bold', true);
    });

    it('should toggle italic formatting', () => {
      mockQuill.getSelection.mockReturnValue({ index: 0, length: 5 });
      mockQuill.getFormat.mockReturnValue({ italic: false });

      render(<Toolbar quill={mockQuill} />);
      fireEvent.click(screen.getByTitle('Italic (Ctrl+I)'));

      expect(mockQuill.format).toHaveBeenCalledWith('italic', true);
    });

    it('should toggle underline formatting', () => {
      mockQuill.getSelection.mockReturnValue({ index: 0, length: 5 });
      mockQuill.getFormat.mockReturnValue({ underline: false });

      render(<Toolbar quill={mockQuill} />);
      fireEvent.click(screen.getByTitle('Underline (Ctrl+U)'));

      expect(mockQuill.format).toHaveBeenCalledWith('underline', true);
    });
  });

  describe('Headings', () => {
    it('should apply heading 1', () => {
      mockQuill.getSelection.mockReturnValue({ index: 0, length: 5 });
      mockQuill.getFormat.mockReturnValue({ header: false });

      render(<Toolbar quill={mockQuill} />);
      fireEvent.click(screen.getByTitle('Heading 1 (Ctrl+1)'));

      expect(mockQuill.format).toHaveBeenCalledWith('header', 1);
    });

    it('should remove heading when clicking again', () => {
      mockQuill.getSelection.mockReturnValue({ index: 0, length: 5 });
      mockQuill.getFormat.mockReturnValue({ header: 1 });

      render(<Toolbar quill={mockQuill} />);
      fireEvent.click(screen.getByTitle('Heading 1 (Ctrl+1)'));

      expect(mockQuill.format).toHaveBeenCalledWith('header', false);
    });
  });

  describe('Lists', () => {
    it('should apply bullet list', () => {
      mockQuill.getSelection.mockReturnValue({ index: 0, length: 5 });
      mockQuill.getFormat.mockReturnValue({ list: false });

      render(<Toolbar quill={mockQuill} />);
      fireEvent.click(screen.getByTitle('Bullet List (Ctrl+L)'));

      expect(mockQuill.format).toHaveBeenCalledWith('list', 'bullet');
    });

    it('should remove list when clicking again', () => {
      mockQuill.getSelection.mockReturnValue({ index: 0, length: 5 });
      mockQuill.getFormat.mockReturnValue({ list: 'bullet' });

      render(<Toolbar quill={mockQuill} />);
      fireEvent.click(screen.getByTitle('Bullet List (Ctrl+L)'));

      expect(mockQuill.format).toHaveBeenCalledWith('list', false);
    });
  });

  describe('Alignment', () => {
    it('should apply left alignment', () => {
      mockQuill.getSelection.mockReturnValue({ index: 0, length: 5 });

      render(<Toolbar quill={mockQuill} />);
      fireEvent.click(screen.getByTitle('Align Left'));

      expect(mockQuill.format).toHaveBeenCalledWith('align', 'left');
    });

    it('should apply center alignment', () => {
      mockQuill.getSelection.mockReturnValue({ index: 0, length: 5 });

      render(<Toolbar quill={mockQuill} />);
      fireEvent.click(screen.getByTitle('Align Center'));

      expect(mockQuill.format).toHaveBeenCalledWith('align', 'center');
    });

    it('should apply right alignment', () => {
      mockQuill.getSelection.mockReturnValue({ index: 0, length: 5 });

      render(<Toolbar quill={mockQuill} />);
      fireEvent.click(screen.getByTitle('Align Right'));

      expect(mockQuill.format).toHaveBeenCalledWith('align', 'right');
    });
  });

  describe('Undo/Redo', () => {
    it('should call undo', () => {
      render(<Toolbar quill={mockQuill} />);
      fireEvent.click(screen.getByTitle('Undo (Ctrl+Z)'));

      expect(mockQuill.history.undo).toHaveBeenCalled();
    });

    it('should call redo', () => {
      render(<Toolbar quill={mockQuill} />);
      fireEvent.click(screen.getByTitle('Redo (Ctrl+Y)'));

      expect(mockQuill.history.redo).toHaveBeenCalled();
    });
  });

  describe('Text Color', () => {
    it('should apply text color', () => {
      mockQuill.getSelection.mockReturnValue({ index: 0, length: 5 });

      render(<Toolbar quill={mockQuill} />);
      const colorInputs = screen.getAllByTitle('Text Color');
      const colorInput = colorInputs.find(input => input.tagName === 'INPUT') as HTMLInputElement;
      
      fireEvent.change(colorInput, { target: { value: '#ff0000' } });

      expect(mockQuill.format).toHaveBeenCalledWith('color', '#ff0000');
    });

    it('should apply background color', () => {
      mockQuill.getSelection.mockReturnValue({ index: 0, length: 5 });

      render(<Toolbar quill={mockQuill} />);
      const colorInputs = screen.getAllByTitle('Background Color');
      const colorInput = colorInputs.find(input => input.tagName === 'INPUT') as HTMLInputElement;
      
      fireEvent.change(colorInput, { target: { value: '#ffff00' } });

      expect(mockQuill.format).toHaveBeenCalledWith('background', '#ffff00');
    });
  });

  describe('Link', () => {
    beforeEach(() => {
      global.prompt = jest.fn();
    });

    it('should insert link when URL is provided', () => {
      mockQuill.getSelection.mockReturnValue({ index: 0, length: 5 });
      (global.prompt as jest.Mock).mockReturnValue('https://example.com');

      render(<Toolbar quill={mockQuill} />);
      fireEvent.click(screen.getByTitle('Insert Link'));

      expect(mockQuill.format).toHaveBeenCalledWith('link', 'https://example.com');
    });

    it('should not insert link when URL is not provided', () => {
      mockQuill.getSelection.mockReturnValue({ index: 0, length: 5 });
      (global.prompt as jest.Mock).mockReturnValue(null);

      render(<Toolbar quill={mockQuill} />);
      fireEvent.click(screen.getByTitle('Insert Link'));

      expect(mockQuill.format).not.toHaveBeenCalled();
    });
  });

  describe('Image', () => {
    beforeEach(() => {
      global.prompt = jest.fn();
    });

    it('should insert image when URL is provided', () => {
      mockQuill.getSelection.mockReturnValue({ index: 0, length: 5 });
      (global.prompt as jest.Mock).mockReturnValue('https://example.com/image.jpg');

      render(<Toolbar quill={mockQuill} />);
      fireEvent.click(screen.getByTitle('Insert Image'));

      expect(mockQuill.insertEmbed).toHaveBeenCalledWith(0, 'image', 'https://example.com/image.jpg');
    });

    it('should not insert image when URL is not provided', () => {
      mockQuill.getSelection.mockReturnValue({ index: 0, length: 5 });
      (global.prompt as jest.Mock).mockReturnValue(null);

      render(<Toolbar quill={mockQuill} />);
      fireEvent.click(screen.getByTitle('Insert Image'));

      expect(mockQuill.insertEmbed).not.toHaveBeenCalled();
    });
  });

  describe('Code Block', () => {
    it('should toggle code block', () => {
      mockQuill.getSelection.mockReturnValue({ index: 0, length: 5 });
      mockQuill.getFormat.mockReturnValue({ codeBlock: false });

      render(<Toolbar quill={mockQuill} />);
      fireEvent.click(screen.getByTitle('Code Block'));

      expect(mockQuill.format).toHaveBeenCalledWith('code-block', true);
    });

    it('should remove code block when clicking again', () => {
      mockQuill.getSelection.mockReturnValue({ index: 0, length: 5 });
      mockQuill.getFormat.mockReturnValue({ codeBlock: true });

      render(<Toolbar quill={mockQuill} />);
      fireEvent.click(screen.getByTitle('Code Block'));

      expect(mockQuill.format).toHaveBeenCalledWith('code-block', false);
    });
  });

  describe('Without Quill Instance', () => {
    it('should render loading state when quill is null', () => {
      render(<Toolbar quill={null} />);
      expect(screen.getByText('Loading...')).toBeInTheDocument();
    });
  });
}); 