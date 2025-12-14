import { Request, Response, NextFunction } from 'express';

export type Role = 'ADMIN' | 'USER' | 'VIEWER';

const roleHierarchy: Record<Role, number> = {
  ADMIN: 3,
  USER: 2,
  VIEWER: 1,
};

/**
 * Role-based access control middleware
 * Requires authentication middleware to run first
 */
export function requireRole(...allowedRoles: Role[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized - Authentication required' });
    }

    const userRole = (req.user.role || 'VIEWER').toUpperCase() as Role;
    const userRoleLevel = roleHierarchy[userRole] || 0;

    // Check if user has one of the allowed roles
    const hasAccess = allowedRoles.some(role => {
      const requiredLevel = roleHierarchy[role];
      return userRoleLevel >= requiredLevel;
    });

    if (!hasAccess) {
      return res.status(403).json({
        error: 'Forbidden - Insufficient permissions',
        required: allowedRoles,
        current: userRole,
      });
    }

    next();
  };
}

/**
 * Require admin role
 */
export const requireAdmin = requireRole('ADMIN');

/**
 * Require user role or higher (USER or ADMIN)
 */
export const requireUser = requireRole('USER', 'ADMIN');

