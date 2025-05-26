import { Delta } from 'quill';
import type { Change } from '../plugins/TrackChanges';

export interface DocumentMetadata {
  title?: string;
  author?: string;
  created?: number;
  modified?: number;
  version?: number;
  [key: string]: any;
}

export interface EditorProps {
  documentId?: string;
  version?: number;
  initialContent?: string | Delta;
  value?: Delta;
  metadata?: Partial<DocumentMetadata>;
  trackChanges?: boolean;
  autosave?: boolean;
  header?: React.ReactNode;
  marginLeft?: string;
  marginRight?: string;
  marginTop?: string;
  showLineNumbers?: boolean;
  enableMarkdown?: boolean;
  currentUser?: string;
  placeholder?: string;
  onSave?: (content: any) => void;
  onChange?: (content: any) => void;
  onContentChange?: (delta: Delta) => void;
  onMetadataChange?: (metadata: Record<string, any>) => void;
  onChangesUpdate?: (changes: Change[]) => void;
}

export interface EditorRef {
  getContent: (format?: 'html' | 'delta' | 'text' | 'markdown') => any;
  setContent: (content: string | Delta, format?: 'html' | 'delta' | 'text' | 'markdown') => void;
  focus: () => void;
  acceptChange: (changeId: string) => void;
  rejectChange: (changeId: string) => void;
  acceptAllChanges: () => void;
  rejectAllChanges: () => void;
  getChanges: () => Change[];
  getPendingChanges: () => Change[];
  exportDocx: () => Promise<void>;
  exportPDF: () => void;
} 