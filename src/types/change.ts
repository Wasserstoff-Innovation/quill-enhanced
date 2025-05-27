export interface Change {
  id: string;
  type: 'insert' | 'delete' | 'format';
  content: string;
  author: string;
  timestamp: number;
  index: number;
  length: number;
  attributes?: Record<string, any>;
}

export const createChange = (
  type: 'insert' | 'delete' | 'format',
  content: string,
  author: string,
  index: number,
  length: number,
  attributes?: Record<string, any>
): Change => {
  return {
    id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    type,
    content,
    author,
    timestamp: Date.now(),
    index,
    length,
    attributes
  };
}; 