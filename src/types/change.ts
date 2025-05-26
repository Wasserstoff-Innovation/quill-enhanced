import { Delta, DeltaOperation } from './delta';
import { User } from './user';

export interface Change {
  id: string;
  author: User;
  timestamp: number;
  operations: DeltaOperation[];
  status: 'pending' | 'accepted' | 'rejected';
}

export const createChange = (
  author: User,
  operations: DeltaOperation[],
  status: Change['status'] = 'pending'
): Change => {
  return {
    id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    author,
    timestamp: Date.now(),
    operations,
    status
  };
}; 