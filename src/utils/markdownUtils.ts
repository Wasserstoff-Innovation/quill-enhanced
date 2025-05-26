import Quill from 'quill';
const Delta = Quill.import('delta');
type DeltaType = InstanceType<typeof Delta>;

import TurndownService from 'turndown';
import { marked } from 'marked';
import DOMPurify from 'dompurify';

import type { Delta, DeltaOperation } from '../core/types';

// Configure Turndown with better defaults
const turndown = new TurndownService({
  headingStyle: 'atx',
  codeBlockStyle: 'fenced',
  emDelimiter: '*',
  bulletListMarker: '-',
  strongDelimiter: '**'
});

// Configure marked with security options
marked.setOptions({
  gfm: true,
  breaks: true
});

/**
 * Converts a Quill Delta to Markdown
 * @param delta - The Quill Delta to convert
 * @returns The markdown string
 */
export function toMarkdown(delta: Delta): string {
  if (!delta.ops || delta.ops.length === 0) {
    return '';
  }

  let markdown = '';
  let currentListType: string | null = null;
  let listIndent = 0;

  delta.ops.forEach((op: DeltaOperation) => {
    if (typeof op.insert === 'string') {
      let text = op.insert;

      // Handle headers
      if (op.attributes?.header) {
        const level = op.attributes.header;
        text = '#'.repeat(level) + ' ' + text;
      }

      // Handle lists
      if (op.attributes?.list) {
        const listType = op.attributes.list;
        if (listType !== currentListType) {
          if (currentListType) {
            markdown += '\n';
          }
          currentListType = listType;
          listIndent = 0;
        }
        text = '  '.repeat(listIndent) + '• ' + text;
      } else {
        currentListType = null;
        listIndent = 0;
      }

      // Handle blockquotes
      if (op.attributes?.blockquote) {
        text = '> ' + text;
      }

      // Handle code blocks
      if (op.attributes?.['code-block']) {
        text = '```\n' + text + '\n```';
      }

      // Handle inline formatting
      if (op.attributes?.bold) {
        text = '**' + text + '**';
      }
      if (op.attributes?.italic) {
        text = '_' + text + '_';
      }
      if (op.attributes?.underline) {
        text = '__' + text + '__';
      }
      if (op.attributes?.strike) {
        text = '~~' + text + '~~';
      }

      markdown += text;
    }
  });

  return markdown;
}

/**
 * Converts Markdown to a Quill Delta
 * @param markdown - The markdown string to convert
 * @returns The Quill Delta
 */
export function fromMarkdown(markdown: string): Delta {
  const ops: DeltaOperation[] = [];
  const lines = markdown.split('\n');
  let currentListType: string | null = null;
  let listIndent = 0;

  lines.forEach((line) => {
    // Handle headers
    const headerMatch = line.match(/^(#{1,6})\s+(.+)$/);
    if (headerMatch) {
      const level = headerMatch[1].length;
      const text = headerMatch[2];
      ops.push({
        insert: text + '\n',
        attributes: { header: level }
      });
      return;
    }

    // Handle lists
    const listMatch = line.match(/^(\s*)[-•]\s+(.+)$/);
    if (listMatch) {
      const indent = listMatch[1].length / 2;
      const text = listMatch[2];
      if (indent > listIndent) {
        listIndent = indent;
      }
      ops.push({
        insert: '- ',
        attributes: { list: 'bullet' }
      });
      ops.push({
        insert: text + '\n'
      });
      return;
    }

    // Handle blockquotes
    const blockquoteMatch = line.match(/^>\s+(.+)$/);
    if (blockquoteMatch) {
      ops.push({
        insert: blockquoteMatch[1] + '\n',
        attributes: { blockquote: true }
      });
      return;
    }

    // Handle code blocks
    if (line.startsWith('```')) {
      const codeBlock = lines.slice(lines.indexOf(line) + 1, lines.indexOf('```', lines.indexOf(line) + 1)).join('\n');
      ops.push({
        insert: codeBlock + '\n',
        attributes: { 'code-block': true }
      });
      return;
    }

    // Handle inline formatting
    let text = line;
    const boldMatches = text.match(/\*\*(.+?)\*\*/g) || [];
    boldMatches.forEach(match => {
      const content = match.slice(2, -2);
      const index = text.indexOf(match);
      if (index > 0) {
        ops.push({ insert: text.slice(0, index) });
      }
      ops.push({
        insert: content,
        attributes: { bold: true }
      });
      text = text.slice(index + match.length);
    });

    const italicMatches = text.match(/_(.+?)_/g) || [];
    italicMatches.forEach(match => {
      const content = match.slice(1, -1);
      const index = text.indexOf(match);
      if (index > 0) {
        ops.push({ insert: text.slice(0, index) });
      }
      ops.push({
        insert: content,
        attributes: { italic: true }
      });
      text = text.slice(index + match.length);
    });

    if (text) {
      ops.push({ insert: text + '\n' });
    }
  });

  return { ops };
}

/**
 * Converts HTML to Markdown
 * @param html - The HTML string to convert
 * @returns The markdown string
 */
export function htmlToMarkdown(html: string): string {
  return turndown.turndown(html);
}

/**
 * Sanitizes Markdown content
 * @param markdown - The markdown string to sanitize
 * @returns The sanitized markdown string
 */
export const sanitizeMarkdown = (markdown: string): string => {
  const html = marked(markdown) as string;
  const sanitizedHtml = DOMPurify.sanitize(html, {
    ALLOWED_TAGS: ['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'br', 'strong', 'em', 'code', 'pre', 'ul', 'ol', 'li', 'blockquote'],
    ALLOWED_ATTR: []
  });
  return turndown.turndown(sanitizedHtml);
};

/**
 * Helper function to convert Delta to HTML
 * @param delta - The Quill Delta to convert
 * @returns The HTML string
 */
export const deltaToHtml = (delta: DeltaType): string => {
  const tempDiv = document.createElement('div');
  const quill = new Quill(tempDiv);
  quill.setContents(delta);
  return tempDiv.querySelector('.ql-editor')?.innerHTML || '';
};

/**
 * Helper function to convert HTML to Delta
 * @param html - The HTML string to convert
 * @returns The Quill Delta
 */
export const htmlToDelta = (html: string): DeltaType => {
  const tempDiv = document.createElement('div');
  const quill = new Quill(tempDiv);
  tempDiv.querySelector('.ql-editor')!.innerHTML = html;
  return quill.getContents();
};

/**
 * Converts Markdown to HTML
 * @param markdown - The markdown string to convert
 * @returns The HTML string
 */
export const markdownToHtml = (markdown: string): string => {
  return marked(markdown) as string;
};

/**
 * Converts Delta to Markdown
 * @param delta - The Quill Delta to convert
 * @returns The markdown string
 */
export const deltaToMarkdown = (delta: DeltaType): string => {
  return toMarkdown(delta);
};

/**
 * Creates an HTML preview from Markdown
 * @param markdown - The markdown string to preview
 * @returns The sanitized HTML preview
 */
export const createMarkdownPreview = (markdown: string): string => {
  const html = marked(markdown) as string;
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: ['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'br', 'strong', 'em', 'code', 'pre', 'ul', 'ol', 'li', 'blockquote'],
    ALLOWED_ATTR: []
  });
}; 