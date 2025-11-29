# Architecture Rules

## DRY Principle
- Always assess if code can be reused, refactored, or consolidated before creating new code
- Use shared types from `@event-management/shared` package
- Create reusable components and utilities

## Module Structure
- Each module (Artists, Vendors, etc.) follows the same pattern:
  - Line items with statuses, categories, and tags
  - Module-specific metadata stored in `metadata` JSON field
  - Consistent API endpoints and UI patterns

## Type Safety
- Use TypeScript types from shared package
- Avoid `any` types - use proper interfaces
- Keep frontend and backend types in sync via shared package

## UI Consistency
- Use Tailwind CSS utility classes
- Follow the design system defined in `frontend/src/index.css`
- Use consistent button styles (btn, btn-primary, btn-secondary, btn-danger)
- Use card component for containers
- Use input and label classes for forms

## API Design
- RESTful endpoints
- Consistent error handling
- Use Prisma for database operations
- Validate inputs on backend

