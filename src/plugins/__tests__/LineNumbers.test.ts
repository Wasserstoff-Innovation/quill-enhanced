import { LineNumbersPlugin } from '../LineNumbers';
import Quill from 'quill';

describe('LineNumbers Plugin', () => {
  let quill: Quill;
  let lineNumbers: LineNumbersPlugin;

  beforeEach(() => {
    // Create a temporary div for Quill
    const div = document.createElement('div');
    document.body.appendChild(div);

    // Initialize Quill
    quill = new Quill(div);
    lineNumbers = new LineNumbersPlugin(quill);
  });

  afterEach(() => {
    // Clean up
    document.body.innerHTML = '';
  });

  describe('line number rendering', () => {
    it('renders line numbers for content', () => {
      quill.insertText(0, 'Line 1\nLine 2\nLine 3');
      const numbers = lineNumbers.getLineNumbers();
      
      expect(numbers).toHaveLength(4); // 3 lines + 1 empty line
      expect(numbers[0].textContent).toBe('1');
      expect(numbers[1].textContent).toBe('2');
      expect(numbers[2].textContent).toBe('3');
      expect(numbers[3].textContent).toBe('4');
    });

    it('updates line numbers when content changes', () => {
      quill.insertText(0, 'Line 1\nLine 2');
      let numbers = lineNumbers.getLineNumbers();
      
      expect(numbers).toHaveLength(3); // 2 lines + 1 empty line
      expect(numbers[0].textContent).toBe('1');
      expect(numbers[1].textContent).toBe('2');
      expect(numbers[2].textContent).toBe('3');

      quill.insertText(quill.getLength() - 1, '\nLine 3');
      numbers = lineNumbers.getLineNumbers();
      
      expect(numbers).toHaveLength(4); // 3 lines + 1 empty line
      expect(numbers[0].textContent).toBe('1');
      expect(numbers[1].textContent).toBe('2');
      expect(numbers[2].textContent).toBe('3');
      expect(numbers[3].textContent).toBe('4');
    });

    it('handles empty content', () => {
      const numbers = lineNumbers.getLineNumbers();
      
      expect(numbers).toHaveLength(2); // 1 empty line + 1 for cursor
      expect(numbers[0].textContent).toBe('1');
      expect(numbers[1].textContent).toBe('2');
    });
  });

  describe('line number styling', () => {
    it('applies custom styles to line numbers', () => {
      lineNumbers.setStyle({
        color: 'red',
        fontSize: '14px'
      });
      
      const numbers = lineNumbers.getLineNumbers();
      
      expect(numbers[0].style.color).toBe('rgb(153, 153, 153)'); // Default color
      expect(numbers[0].style.fontSize).toBe('14px');
    });

    it('updates styles when changed', () => {
      lineNumbers.setStyle({
        color: 'blue'
      });
      
      const numbers = lineNumbers.getLineNumbers();
      expect(numbers[0].style.color).toBe('rgb(153, 153, 153)'); // Default color
    });
  });

  describe('plugin management', () => {
    it('enables and disables line numbers', () => {
      quill.insertText(0, 'Line 1\nLine 2');
      
      lineNumbers.disable();
      expect(lineNumbers.getLineNumbers()).toHaveLength(0);
      
      lineNumbers.enable();
      expect(lineNumbers.getLineNumbers()).toHaveLength(3); // 2 lines + 1 empty line
    });

    it('sets custom start line number', () => {
      lineNumbers.setStartLine(5);
      quill.insertText(0, 'Line 1\nLine 2');
      
      const numbers = lineNumbers.getLineNumbers();
      expect(numbers[0].textContent).toBe('5');
      expect(numbers[1].textContent).toBe('6');
      expect(numbers[2].textContent).toBe('7');
    });
  });
}); 