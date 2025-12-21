import { Request, Response, NextFunction } from 'express';
import { auth } from '../lib/auth';

// Extend Express Request type to include user
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        name?: string | null;
        role: string;
      };
      session?: {
        id: string;
        userId: string;
        expiresAt: Date;
      };
    }
  }
}

/**
 * Authentication middleware
 * Verifies the session token and attaches user to request
 */
export async function requireAuth(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    // Create a request-like object for betterAuth API
    const authRequest = {
      headers: new Headers(),
      cookies: req.headers.cookie || '',
    };

    // Copy headers
    Object.entries(req.headers).forEach(([key, value]) => {
      if (value) {
        authRequest.headers.set(key, Array.isArray(value) ? value[0] : value);
      }
    });

    // Get session from betterAuth
    const session = await auth.api.getSession({
      headers: authRequest.headers,
    });

    if (!session || !session.user) {
      return res.status(401).json({ error: 'Unauthorized - No valid session' });
    }

    // Attach user and session to request
    req.user = {
      id: session.user.id,
      email: session.user.email,
      name: session.user.name,
      role: (session.user as any).role || 'USER',
    };
    req.session = {
      id: session.session.id,
      userId: session.user.id,
      expiresAt: session.session.expiresAt,
    };

    next();
  } catch (error: any) {
    console.error('Auth middleware error:', error);
    console.error('Auth middleware error details:', {
      message: error?.message,
      stack: error?.stack,
      name: error?.name,
    });
    return res.status(401).json({ error: 'Unauthorized - Invalid session' });
  }
}

/**
 * Optional auth middleware - attaches user if session exists but doesn't require it
 */
export async function optionalAuth(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const authRequest = {
      headers: new Headers(),
      cookies: req.headers.cookie || '',
    };

    Object.entries(req.headers).forEach(([key, value]) => {
      if (value) {
        authRequest.headers.set(key, Array.isArray(value) ? value[0] : value);
      }
    });

    const session = await auth.api.getSession({
      headers: authRequest.headers,
    });

    if (session && session.user) {
      req.user = {
        id: session.user.id,
        email: session.user.email,
        name: session.user.name,
        role: (session.user as any).role || 'USER',
      };
      req.session = {
        id: session.session.id,
        userId: session.user.id,
        expiresAt: session.session.expiresAt,
      };
    }
    next();
  } catch (error) {
    // Continue without user if session is invalid
    next();
  }
}

