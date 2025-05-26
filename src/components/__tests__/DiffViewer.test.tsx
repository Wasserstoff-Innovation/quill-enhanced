import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { DiffViewer } from '../DiffViewer';
import Quill from 'quill';
import { jest } from '@jest/globals';

const Delta = Quill.import('delta');

describe('DiffViewer Component', () => {
  const originalContent = new Delta([
    { insert: 'Hello, World!\n' },
    { insert: 'This is the old content.\n' }
  ]);

  const modifiedContent = new Delta([
    { insert: 'Hello, New World!\n' },
    { insert: 'This is the new content.\n' }
  ]);

  it('renders the diff viewer', () => {
    render(
      <DiffViewer
        originalContent={originalContent}
        modifiedContent={modifiedContent}
      />
    );
    expect(screen.getByText('Changes')).toBeInTheDocument();
  });

  it('handles empty deltas', () => {
    render(
      <DiffViewer
        originalContent={new Delta()}
        modifiedContent={new Delta()}
      />
    );
    expect(screen.getByText('Changes')).toBeInTheDocument();
  });

  it('calls onAcceptChange when accepting changes', () => {
    const onAcceptChange = jest.fn();
    render(
      <DiffViewer
        originalContent={originalContent}
        modifiedContent={modifiedContent}
        onAcceptChange={onAcceptChange}
      />
    );
    
    const acceptButtons = screen.getAllByText('Accept');
    fireEvent.click(acceptButtons[0]);
    expect(onAcceptChange).toHaveBeenCalled();
  });

  it('calls onRejectChange when rejecting changes', () => {
    const onRejectChange = jest.fn();
    render(
      <DiffViewer
        originalContent={originalContent}
        modifiedContent={modifiedContent}
        onRejectChange={onRejectChange}
      />
    );
    
    const rejectButtons = screen.getAllByText('Reject');
    fireEvent.click(rejectButtons[0]);
    expect(onRejectChange).toHaveBeenCalled();
  });

  it('toggles between unified and split view', () => {
    render(
      <DiffViewer
        originalContent={originalContent}
        modifiedContent={modifiedContent}
      />
    );
    
    const splitViewButton = screen.getByText('Split View');
    fireEvent.click(splitViewButton);
    expect(splitViewButton).toHaveClass('active');
    
    const unifiedViewButton = screen.getByText('Unified View');
    fireEvent.click(unifiedViewButton);
    expect(unifiedViewButton).toHaveClass('active');
  });
}); 