import Quill from 'quill';
const Delta = Quill.import('delta');
type DeltaType = InstanceType<typeof Delta>;

// If you want to use diffWords, ensure 'diff' is installed and imported correctly
// import { diffWords } from 'diff';

/**
 * Gets the difference between two Deltas
 */
export const getDiff = (oldDelta: DeltaType, newDelta: DeltaType): DeltaType => {
  // Simple diff: just compare text content
  const newText = deltaToText(newDelta);
  // This is a placeholder; you can implement a more sophisticated diff if needed
  // For now, just return a Delta with the new text
  return new Delta([{ insert: newText }]);
};

/**
 * Applies a diff Delta to the original Delta
 */
export const applyDiff = (original: DeltaType, diff: DeltaType): DeltaType => {
  return original.compose(diff);
};

/**
 * Formats a diff Delta for display
 */
export const formatDiff = (diff: DeltaType): string => {
  return diff.ops
    .map((op: any) => {
      if (op.attributes?.color === 'green') {
        return `+${op.insert}`;
      } else if (op.attributes?.color === 'red') {
        return `-${op.insert}`;
      }
      return op.insert;
    })
    .join('');
};

export const deltaToText = (delta: DeltaType): string => {
  return delta.ops
    .map((op: any) => op.insert)
    .filter((text: any): text is string => typeof text === 'string')
    .join('');
};

export interface DiffResult {
  insertions: Array<{
    index: number;
    text: string;
    length: number;
  }>;
  deletions: Array<{
    index: number;
    text: string;
    length: number;
  }>;
  blockChanges: Array<{
    index: number;
    type: 'insert' | 'delete';
    content: string;
  }>;
}

export function computeDiff(oldDelta: DeltaType, newDelta: DeltaType): DiffResult {
  const result: DiffResult = {
    insertions: [],
    deletions: [],
    blockChanges: []
  };
  const oldText = deltaToText(oldDelta);
  const newText = deltaToText(newDelta);
  const oldLines = oldText.split('\n');
  const newLines = newText.split('\n');
  let i = 0;
  let j = 0;
  while (i < oldLines.length || j < newLines.length) {
    if (i < oldLines.length && j < newLines.length && oldLines[i] === newLines[j]) {
      i++;
      j++;
      continue;
    }
    if (j < newLines.length && (i >= oldLines.length || oldLines[i] !== newLines[j])) {
      result.insertions.push({
        index: j,
        text: newLines[j],
        length: newLines[j].length
      });
      j++;
    }
    if (i < oldLines.length && (j >= newLines.length || oldLines[i] !== newLines[j])) {
      result.deletions.push({
        index: i,
        text: oldLines[i],
        length: oldLines[i].length
      });
      i++;
    }
  }
  return result;
}

export function applyDiffHighlighting(delta: DeltaType, diffResult: DiffResult): DeltaType {
  const result = new Delta(delta.ops);
  diffResult.deletions.forEach(deletion => {
    result.retain(deletion.index);
    result.delete(deletion.length);
    result.insert(deletion.text, { strike: true, color: '#ff0000' });
  });
  diffResult.insertions.forEach(insertion => {
    result.retain(insertion.index);
    result.insert(insertion.text, { background: '#cce8cc', color: '#003700' });
  });
  return result;
}

export function createUnifiedDiff(oldDelta: DeltaType, newDelta: DeltaType): DeltaType {
  const diffResult = computeDiff(oldDelta, newDelta);
  return applyDiffHighlighting(newDelta, diffResult);
}

export function createSplitDiffs(oldDelta: DeltaType, newDelta: DeltaType): {
  original: DeltaType;
  modified: DeltaType;
} {
  const diffResult = computeDiff(oldDelta, newDelta);
  const original = new Delta(oldDelta.ops);
  const modified = new Delta(newDelta.ops);
  diffResult.deletions.forEach(deletion => {
    original.retain(deletion.index);
    original.delete(deletion.length);
    original.insert(deletion.text, { strike: true, color: '#ff0000' });
  });
  diffResult.insertions.forEach(insertion => {
    modified.retain(insertion.index);
    modified.insert(insertion.text, { background: '#cce8cc', color: '#003700' });
  });
  return { original, modified };
} 