import type { DeltaOperation } from 'quill';
import Quill from 'quill';
import * as FileSaver from 'file-saver';
import { Document, Packer, Paragraph, TextRun, AlignmentType, UnderlineType } from 'docx';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { toMarkdown } from './markdownUtils';

const Delta = Quill.import('delta');
type DeltaType = InstanceType<typeof Delta>;

interface QuillAttributes {
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  strike?: boolean;
  color?: string;
  size?: number;
  align?: 'left' | 'center' | 'right' | 'justify';
}

/**
 * Converts a Quill Delta to a format suitable for DOCX export
 */
function deltaToDocx(delta: DeltaType): Document {
  const paragraphs: Paragraph[] = [];
  let currentParagraph: Paragraph | null = null;

  delta.ops.forEach((op: DeltaOperation) => {
    if (typeof op.insert === 'string') {
      const text = op.insert;
      const attributes = (op.attributes || {}) as QuillAttributes;

      // Handle newlines
      if (text.includes('\n')) {
        const lines = text.split('\n');
        lines.forEach((line: string) => {
          if (line) {
            const textRun = new TextRun({
              text: line,
              bold: attributes.bold,
              italics: attributes.italic,
              underline: attributes.underline ? { type: UnderlineType.SINGLE } : undefined,
              strike: attributes.strike,
              color: attributes.color,
              size: attributes.size ? Math.round(attributes.size * 2) : 24 // Convert to half-points
            });

            currentParagraph = new Paragraph({
              children: [textRun],
              alignment: mapAlignment(attributes.align)
            });

            paragraphs.push(currentParagraph);
          }
        });
      } else {
        const textRun = new TextRun({
          text,
          bold: attributes.bold,
          italics: attributes.italic,
          underline: attributes.underline ? { type: UnderlineType.SINGLE } : undefined,
          strike: attributes.strike,
          color: attributes.color,
          size: attributes.size ? Math.round(attributes.size * 2) : 24
        });

        if (!currentParagraph) {
          currentParagraph = new Paragraph({
            children: [textRun],
            alignment: mapAlignment(attributes.align)
          });
          paragraphs.push(currentParagraph);
        } else {
          currentParagraph.addChildElement(textRun);
        }
      }
    }
  });

  return new Document({
    sections: [{
      properties: {},
      children: paragraphs
    }]
  });
}

/**
 * Maps Quill alignment to DOCX alignment
 */
function mapAlignment(align?: string): typeof AlignmentType[keyof typeof AlignmentType] {
  switch (align) {
    case 'center':
      return AlignmentType.CENTER;
    case 'right':
      return AlignmentType.RIGHT;
    case 'justify':
      return AlignmentType.BOTH;
    default:
      return AlignmentType.LEFT;
  }
}

/**
 * Exports a Quill Delta to DOCX format
 */
export async function exportToDocx(delta: DeltaType, filename: string = 'document.docx'): Promise<ArrayBuffer> {
  try {
    const doc = deltaToDocx(delta);
    const buffer = await Packer.toBuffer(doc);
    
    // Save the file if we're in a browser environment
    if (typeof window !== 'undefined' && typeof document !== 'undefined') {
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });
      FileSaver.saveAs(blob, filename);
    }
    
    return buffer as unknown as ArrayBuffer;
  } catch (error) {
    console.error('Error exporting to DOCX:', error);
    throw error;
  }
}

/**
 * Exports a Quill Delta to PDF format
 */
export async function exportToPDF(delta: DeltaType, filename: string = 'document.pdf'): Promise<ArrayBuffer> {
  try {
    // Create a temporary container for the content
    const container = document.createElement('div');
    container.style.width = '8.5in';
    container.style.padding = '1in';
    container.style.position = 'absolute';
    container.style.left = '-9999px';
    document.body.appendChild(container);

    // Create a temporary Quill instance to render the content
    const tempQuill = new Quill(container, {
      theme: 'snow',
      readOnly: true,
      modules: {
        toolbar: false
      }
    });
    tempQuill.setContents(delta);

    // Convert the content to canvas
    const canvas = await html2canvas(container, {
      scale: 2, // Higher scale for better quality
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff'
    });

    // Create PDF
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'pt',
      format: 'a4'
    });

    // Calculate dimensions to fit the content
    const imgWidth = pdf.internal.pageSize.getWidth();
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    // Add the image to the PDF
    pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, 0, imgWidth, imgHeight);

    // Get the PDF as ArrayBuffer
    const pdfBuffer = pdf.output('arraybuffer');

    // Save the file if we're in a browser environment
    if (typeof window !== 'undefined' && typeof document !== 'undefined') {
      pdf.save(filename);
    }

    // Clean up
    document.body.removeChild(container);
    
    return pdfBuffer as ArrayBuffer;
  } catch (error) {
    console.error('Error exporting to PDF:', error);
    throw error;
  }
}

/**
 * Exports content to Word document
 */
export const exportToWord = async (delta: DeltaType, filename: string = 'document.docx'): Promise<void> => {
  const doc = new Document({
    sections: [{
      properties: {},
      children: [
        new Paragraph({
          text: deltaToText(delta)
        })
      ]
    }]
  });

  const buffer = await Packer.toBuffer(doc);
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });
  FileSaver.saveAs(blob, filename);
};

/**
 * Exports content to HTML
 */
export const exportToHTML = (delta: DeltaType): string => {
  return deltaToHtml(delta);
};

/**
 * Exports content to Markdown
 */
export const exportToMarkdown = (delta: DeltaType): string => {
  return toMarkdown(delta);
};

/**
 * Helper function to convert Delta to plain text
 */
export const deltaToText = (delta: DeltaType): string => {
  return delta.ops
    .map((op: any) => op.insert)
    .filter((text: any) => typeof text === 'string')
    .join('');
};

/**
 * Helper function to convert Delta to HTML
 */
export const deltaToHtml = (delta: DeltaType): string => {
  let html = '';
  // let currentAttributes: any = {}; // Currently unused but kept for future implementation

  delta.ops.forEach((op: any) => {
    if (typeof op.insert === 'string') {
      const text = op.insert;
      const attributes = op.attributes || {};

      // Handle line breaks and paragraphs
      if (text.includes('\n')) {
        const lines = text.split('\n');
        lines.forEach((line: string, index: number) => {
          if (line || index === 0) {
            html += formatTextWithAttributes(line, attributes);
          }
          if (index < lines.length - 1) {
            html += getBlockElement(attributes);
          }
        });
      } else {
        html += formatTextWithAttributes(text, attributes);
      }
    } else if (typeof op.insert === 'object') {
      // Handle embeds (images, videos, etc.)
      html += formatEmbed(op.insert);
    }
  });

  return html;
};

/**
 * Format text with inline attributes
 */
function formatTextWithAttributes(text: string, attributes: any): string {
  let formattedText = text;

  // Apply inline formatting
  if (attributes.bold) {
    formattedText = `<strong>${formattedText}</strong>`;
  }
  if (attributes.italic) {
    formattedText = `<em>${formattedText}</em>`;
  }
  if (attributes.underline) {
    formattedText = `<u>${formattedText}</u>`;
  }
  if (attributes.strike) {
    formattedText = `<s>${formattedText}</s>`;
  }
  if (attributes.code) {
    formattedText = `<code>${formattedText}</code>`;
  }
  if (attributes.link) {
    formattedText = `<a href="${attributes.link}">${formattedText}</a>`;
  }
  if (attributes.color) {
    formattedText = `<span style="color: ${attributes.color}">${formattedText}</span>`;
  }
  if (attributes.background) {
    formattedText = `<span style="background-color: ${attributes.background}">${formattedText}</span>`;
  }
  if (attributes.size) {
    formattedText = `<span style="font-size: ${attributes.size}">${formattedText}</span>`;
  }

  return formattedText;
}

/**
 * Get block element based on attributes
 */
function getBlockElement(attributes: any): string {
  if (attributes.header) {
    return `</h${attributes.header}><h${attributes.header}>`;
  }
  if (attributes.blockquote) {
    return '</blockquote><blockquote>';
  }
  if (attributes.list) {
    const listType = attributes.list === 'ordered' ? 'ol' : 'ul';
    return `</li></${listType}><${listType}><li>`;
  }
  if (attributes['code-block']) {
    return '</pre><pre>';
  }

  return '</p><p>';
}

/**
 * Format embedded content
 */
function formatEmbed(embed: any): string {
  if (embed.image) {
    return `<img src="${embed.image}" alt="" />`;
  }
  if (embed.video) {
    return `<video src="${embed.video}" controls></video>`;
  }
  if (embed.formula) {
    return `<span class="formula">${embed.formula}</span>`;
  }

  return '';
} 