import type { Delta, DeltaOperation } from '../core/types';

export function createDelta(ops?: DeltaOperation[]): Delta;
export function createEmptyDelta(): Delta;
export function createTextDelta(text: string, attributes?: Record<string, unknown>): Delta;
export function createLineDelta(text: string, attributes?: Record<string, unknown>): Delta;
export function createHeadingDelta(text: string, level: 1 | 2 | 3 | 4 | 5 | 6): Delta;
export function createListDelta(items: string[], ordered?: boolean): Delta;
export function createBlockquoteDelta(text: string): Delta;
export function createCodeBlockDelta(text: string): Delta;
export function mergeDeltas(...deltas: Delta[]): Delta; 