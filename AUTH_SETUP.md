# Authentication Setup Guide

This document describes the authentication implementation using betterAuth.

## Overview

Authentication has been implemented across the entire application using betterAuth with:
- Email/password authentication
- Role-based access control (RBAC) with roles: ADMIN, USER, VIEWER
- Protected API routes
- Protected frontend routes
- Session management with HttpOnly cookies

## Backend Setup

### Environment Variables

Create or update `backend/.env`:

```env
DATABASE_URL="file:./prisma/dev.db"
BETTER_AUTH_SECRET="your-secret-key-here-change-in-production"
BETTER_AUTH_URL="http://localhost:3001"
FRONTEND_URL="http://localhost:5173"
```

**Important**: Generate a secure random string for `BETTER_AUTH_SECRET` in production:
```bash
openssl rand -base64 32
```

### Database Migration

The database schema has been updated with authentication tables:
- `User` - User accounts with email, password, and role
- `Session` - Active user sessions
- `Account` - OAuth accounts (for future use)
- `Verification` - Email verification tokens

Migration has already been run. If you need to run it again:
```bash
cd backend
DATABASE_URL="file:./prisma/dev.db" npm run prisma:migrate
```

### Create Admin User

To create an initial admin user:

```bash
cd backend
DATABASE_URL="file:./prisma/dev.db" tsx src/utils/createAdminUser.ts
```

Or set environment variables:
```bash
ADMIN_EMAIL="admin@example.com" ADMIN_PASSWORD="secure-password" ADMIN_NAME="Admin User" DATABASE_URL="file:./prisma/dev.db" tsx src/utils/createAdminUser.ts
```

Default credentials (if not set):
- Email: `admin@example.com`
- Password: `admin123456`
- Role: `ADMIN`

**⚠️ Change the default password after first login!**

## Frontend Setup

### Environment Variables

Create or update `frontend/.env`:

```env
VITE_BETTER_AUTH_URL="http://localhost:3001"
```

## Running the Application

1. Start the backend:
```bash
cd backend
npm run dev
```

2. Start the frontend:
```bash
cd frontend
npm run dev
```

3. Access the application:
- Frontend: http://localhost:5173
- Backend API: http://localhost:3001

## Authentication Flow

1. **Sign Up**: Users can create accounts at `/signup`
2. **Sign In**: Users sign in at `/login`
3. **Protected Routes**: All routes except `/login` and `/signup` require authentication
4. **API Protection**: All API routes (except `/api/auth/*` and `/health`) require authentication
5. **Session**: Sessions are stored in HttpOnly cookies and persist for 7 days

## Role-Based Access Control

Roles are defined in the database:
- **ADMIN**: Full access to all features
- **USER**: Standard user access
- **VIEWER**: Read-only access (can be enforced in specific routes)

To protect routes with specific roles, use the RBAC middleware:

```typescript
import { requireRole } from '../middleware/rbac';

// Require admin role
router.get('/admin-only', requireAuth, requireRole('ADMIN'), handler);

// Require user or admin
router.post('/create', requireAuth, requireRole('USER', 'ADMIN'), handler);
```

## API Routes

### Public Routes
- `GET /health` - Health check
- `POST /api/auth/sign-in` - Sign in
- `POST /api/auth/sign-up` - Sign up
- `POST /api/auth/sign-out` - Sign out
- `GET /api/auth/session` - Get current session

### Protected Routes
All other `/api/*` routes require authentication via the `requireAuth` middleware.

## Frontend Components

### Auth Context
- `AuthProvider` - Wraps the app and provides auth state
- `useAuth()` - Hook to access current user and session

### Pages
- `LoginPage` - Sign in form at `/login`
- `SignupPage` - Registration form at `/signup`

### Components
- `ProtectedRoute` - Wraps routes that require authentication
- `UserMenu` - User menu in navigation bar with logout

## Testing

1. **Create an admin user** (see above)
2. **Start both servers** (backend and frontend)
3. **Navigate to** http://localhost:5173
4. **You should be redirected to** `/login`
5. **Sign in** with admin credentials
6. **You should be redirected to** `/events`
7. **Verify** that API calls work (check browser network tab)
8. **Test logout** via user menu in top right

## Troubleshooting

### "Unauthorized" errors
- Check that cookies are being sent (browser DevTools > Application > Cookies)
- Verify `BETTER_AUTH_SECRET` is set correctly
- Ensure CORS is configured properly in `backend/src/index.ts`

### Session not persisting
- Check browser cookie settings (should allow cookies)
- Verify `trustedOrigins` includes your frontend URL
- Check that `withCredentials: true` is set in API client

### Database errors
- Ensure Prisma migration has been run
- Check `DATABASE_URL` is correct
- Verify database file exists and is writable

## Security Notes

1. **Production Checklist**:
   - [ ] Change `BETTER_AUTH_SECRET` to a secure random value
   - [ ] Enable email verification (`requireEmailVerification: true`)
   - [ ] Use HTTPS in production
   - [ ] Set secure cookie flags in production
   - [ ] Implement rate limiting on auth endpoints
   - [ ] Change default admin password

2. **Session Security**:
   - Sessions use HttpOnly cookies (not accessible via JavaScript)
   - Sessions expire after 7 days of inactivity
   - Sessions are tied to IP address (can be configured)

3. **Password Security**:
   - Passwords are hashed using bcrypt
   - Minimum 8 characters required (enforced in frontend)

## Next Steps

- [ ] Add email verification
- [ ] Implement password reset flow
- [ ] Add OAuth providers (Google, GitHub, etc.)
- [ ] Add role-based UI restrictions
- [ ] Implement user profile management
- [ ] Add audit logging for auth events

