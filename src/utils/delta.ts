import Quill from 'quill';
import type { Delta, DeltaOperation } from '../core/types';

const Delta = Quill.import('delta');

export const createDelta = (ops?: DeltaOperation[]): Delta => {
  return new Delta(ops);
};

export const createEmptyDelta = (): Delta => {
  return createDelta();
};

export const createTextDelta = (text: string, attributes?: Record<string, unknown>): Delta => {
  return createDelta([{ insert: text, attributes }]);
};

export const createLineDelta = (text: string, attributes?: Record<string, unknown>): Delta => {
  return createDelta([{ insert: text + '\n', attributes }]);
};

export const createHeadingDelta = (text: string, level: 1 | 2 | 3 | 4 | 5 | 6): Delta => {
  return createDelta([{ insert: text + '\n', attributes: { header: level } }]);
};

export const createListDelta = (items: string[], ordered = false): Delta => {
  return createDelta(
    items.map(item => ({
      insert: item + '\n',
      attributes: { list: ordered ? 'ordered' : 'bullet' }
    }))
  );
};

export const createBlockquoteDelta = (text: string): Delta => {
  return createDelta([{ insert: text + '\n', attributes: { blockquote: true } }]);
};

export const createCodeBlockDelta = (text: string): Delta => {
  return createDelta([{ insert: text + '\n', attributes: { 'code-block': true } }]);
};

export const mergeDeltas = (...deltas: Delta[]): Delta => {
  return deltas.reduce((acc, delta) => acc.compose(delta), createEmptyDelta());
}; 