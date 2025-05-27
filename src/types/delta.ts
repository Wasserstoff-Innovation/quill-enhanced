import Quill from 'quill';

const Delta = Quill.import('delta');

export type Delta = typeof Delta;

export interface DeltaOperation {
  insert?: string | object;
  delete?: number;
  retain?: number;
  attributes?: Record<string, any>;
}

export interface DeltaStatic {
  new(ops?: DeltaOperation[]): Delta;
  Op: {
    Insert: (insert: string | object, attributes?: Record<string, any>) => DeltaOperation;
    Delete: (deleteLength: number) => DeltaOperation;
    Retain: (retain: number, attributes?: Record<string, any>) => DeltaOperation;
  };
}

export const createDelta = (ops?: DeltaOperation[]): Delta => {
  return new Delta(ops);
}; 