export interface User {
  id: string;
  email: string;
  name?: string | null;
  role: 'ADMIN' | 'USER' | 'VIEWER';
  emailVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface UpdateUserInput {
  name?: string | null;
  role?: 'ADMIN' | 'USER' | 'VIEWER';
  emailVerified?: boolean;
}

