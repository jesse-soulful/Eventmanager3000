import { Request } from 'express';

/**
 * Create a mock authenticated request
 */
export function createMockAuthRequest(userId: string = 'test-user-id', role: string = 'ADMIN'): Partial<Request> {
  return {
    user: {
      id: userId,
      email: 'test@example.com',
      name: 'Test User',
      role,
    },
    session: {
      id: 'test-session-id',
      userId,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
    },
    headers: {
      'content-type': 'application/json',
    },
  } as Partial<Request>;
}

/**
 * Mock requireAuth middleware for testing
 */
export function mockRequireAuth(req: Request, res: any, next: any) {
  if (!req.user) {
    req.user = {
      id: 'test-user-id',
      email: 'test@example.com',
      name: 'Test User',
      role: 'ADMIN',
    };
    req.session = {
      id: 'test-session-id',
      userId: 'test-user-id',
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
    };
  }
  next();
}

