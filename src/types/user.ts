export interface User {
  id: string;
  name: string;
  color?: string;
  avatar?: string;
}

export const createUser = (id: string, name: string, options?: Partial<User>): User => {
  return {
    id,
    name,
    ...options
  };
}; 