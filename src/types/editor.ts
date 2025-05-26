import { Delta } from 'quill';
import type { Change } from '../plugins/TrackChanges';

export interface EditorProps {
  initialContent?: Delta;
  documentId?: string;
  metadata?: Record<string, any>;
  version?: number;
  onContentChange?: (delta: Delta) => void;
  onMetadataChange?: (metadata: Record<string, any>) => void;
  trackChanges?: boolean;
  currentUser?: string;
  onChangesUpdate?: (changes: Change[]) => void;
}

export interface EditorRef {
  getContent: () => Delta;
  setContent: (content: Delta) => void;
  focus: () => void;
  acceptChange: (changeId: string) => void;
  rejectChange: (changeId: string) => void;
  acceptAllChanges: () => void;
  rejectAllChanges: () => void;
  getChanges: () => Change[];
  getPendingChanges: () => Change[];
} 