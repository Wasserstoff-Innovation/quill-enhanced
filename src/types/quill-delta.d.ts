declare module 'quill-delta' {
  export default class Delta {
    constructor(ops?: any[]);
    ops: any[];
    insert(content: any, attributes?: any): Delta;
    delete(length: number): Delta;
    retain(length: number, attributes?: any): Delta;
    push(newOp: any): Delta;
    chop(): Delta;
    filter(predicate: (op: any) => boolean): Delta;
    forEach(predicate: (op: any) => void): void;
    map<T>(predicate: (op: any) => T): T[];
    partition(predicate: (op: any) => boolean): [Delta, Delta];
    reduce<T>(predicate: (accum: T, curr: any) => T, initialValue: T): T;
    changeLength(): number;
    length(): number;
    slice(start?: number, end?: number): Delta;
    compose(other: Delta): Delta;
    concat(other: Delta): Delta;
    diff(other: Delta): Delta;
    eachLine(predicate: (line: Delta, attributes: any) => boolean | void): boolean;
    invert(base: Delta): Delta;
    transform(other: Delta, priority?: boolean): Delta;
    transformPosition(index: number, priority?: boolean): number;
  }
} 