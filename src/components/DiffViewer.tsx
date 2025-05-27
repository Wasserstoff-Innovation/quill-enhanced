import React, { useState, useEffect } from 'react';
import { computeDiff, createUnifiedDiff, createSplitDiffs } from '../utils/diffUtils';
import Quill from 'quill';

const Delta = Quill.import('delta');
type DeltaStatic = InstanceType<typeof Delta>;

interface DiffViewerProps {
  originalContent: DeltaStatic;
  modifiedContent: DeltaStatic;
  viewMode?: 'unified' | 'split';
  onAcceptChange?: (changeId: string) => void;
  onRejectChange?: (changeId: string) => void;
  onAcceptAllChanges?: () => void;
  onRejectAllChanges?: () => void;
}

interface DeltaOp {
  insert: string;
  attributes?: {
    background?: string;
    strike?: boolean;
    color?: string;
  };
}

export const DiffViewer: React.FC<DiffViewerProps> = ({
  originalContent,
  modifiedContent,
  viewMode: initialViewMode = 'unified',
  onAcceptChange,
  onRejectChange,
  onAcceptAllChanges,
  onRejectAllChanges
}) => {
  const [unifiedView, setUnifiedView] = useState<DeltaStatic | null>(null);
  const [splitView, setSplitView] = useState<{ original: DeltaStatic; modified: DeltaStatic } | null>(null);
  const [viewMode, setViewMode] = useState<'unified' | 'split'>(initialViewMode);

  useEffect(() => {
    // Compute diff between original and modified content
    const diffResult = computeDiff(originalContent, modifiedContent);
    
    // Log diff result for debugging
    console.log('Diff computed:', diffResult);

    // Create unified and split views
    const unified = createUnifiedDiff(originalContent, modifiedContent);
    setUnifiedView(unified);

    const split = createSplitDiffs(originalContent, modifiedContent);
    setSplitView(split);
  }, [originalContent, modifiedContent]);

  const handleAcceptChange = (changeId: string) => {
    onAcceptChange?.(changeId);
  };

  const handleRejectChange = (changeId: string) => {
    onRejectChange?.(changeId);
  };

  const renderUnifiedView = () => {
    if (!unifiedView) return null;

    return (
      <div className="diff-viewer-unified">
        <div className="diff-content">
          {unifiedView.ops.map((op: DeltaOp, index: number) => {
            const isInsertion = op.attributes?.background === '#cce8cc';
            const isDeletion = op.attributes?.strike;

            return (
              <div
                key={index}
                className={`diff-line ${isInsertion ? 'insertion' : ''} ${isDeletion ? 'deletion' : ''}`}
                style={{
                  backgroundColor: isInsertion ? '#e6ffe6' : isDeletion ? '#ffe6e6' : 'transparent',
                  textDecoration: isDeletion ? 'line-through' : 'none',
                  color: isDeletion ? '#ff0000' : 'inherit'
                }}
              >
                {op.insert}
                {isInsertion && (
                  <button
                    className="accept-change"
                    onClick={() => handleAcceptChange(`insert-${index}`)}
                  >
                    Accept
                  </button>
                )}
                {isDeletion && (
                  <button
                    className="reject-change"
                    onClick={() => handleRejectChange(`delete-${index}`)}
                  >
                    Reject
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderSplitView = () => {
    if (!splitView) return null;

    return (
      <div className="diff-viewer-split">
        <div className="original-content">
          <h3>Original</h3>
          <div className="diff-content">
            {splitView.original.ops.map((op: DeltaOp, index: number) => (
              <div
                key={index}
                className={`diff-line ${op.attributes?.strike ? 'deletion' : ''}`}
                style={{
                  backgroundColor: op.attributes?.strike ? '#ffe6e6' : 'transparent',
                  textDecoration: op.attributes?.strike ? 'line-through' : 'none',
                  color: op.attributes?.strike ? '#ff0000' : 'inherit'
                }}
              >
                {op.insert}
                {op.attributes?.strike && (
                  <button
                    className="reject-change"
                    onClick={() => handleRejectChange(`delete-${index}`)}
                  >
                    Reject
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
        <div className="modified-content">
          <h3>Modified</h3>
          <div className="diff-content">
            {splitView.modified.ops.map((op: DeltaOp, index: number) => (
              <div
                key={index}
                className={`diff-line ${op.attributes?.background === '#cce8cc' ? 'insertion' : ''}`}
                style={{
                  backgroundColor: op.attributes?.background === '#cce8cc' ? '#e6ffe6' : 'transparent'
                }}
              >
                {op.insert}
                {op.attributes?.background === '#cce8cc' && (
                  <button
                    className="accept-change"
                    onClick={() => handleAcceptChange(`insert-${index}`)}
                  >
                    Accept
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="diff-viewer">
      <div className="diff-viewer-header">
        <h2>Changes</h2>
        <div className="diff-actions">
          <button
            className="accept-all-btn"
            onClick={() => onAcceptAllChanges?.()}
          >
            Accept All
          </button>
          <button
            className="reject-all-btn"
            onClick={() => onRejectAllChanges?.()}
          >
            Reject All
          </button>
        </div>
        <div className="view-mode-toggle">
          <button
            className={viewMode === 'unified' ? 'active' : ''}
            onClick={() => setViewMode('unified')}
          >
            Unified View
          </button>
          <button
            className={viewMode === 'split' ? 'active' : ''}
            onClick={() => setViewMode('split')}
          >
            Split View
          </button>
        </div>
      </div>
      {viewMode === 'unified' ? renderUnifiedView() : renderSplitView()}
    </div>
  );
};

export default DiffViewer; 