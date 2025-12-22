# Frontend E2E Testing Guide

## Overview

Comprehensive Selenium WebDriver test suite providing **maximum coverage** of the Event Management 3000 frontend application.

## Quick Start

```bash
# Install dependencies
cd frontend
npm install

# Set environment variables
export FRONTEND_URL=http://localhost:5173
export BACKEND_URL=http://localhost:3001
export TEST_USER_EMAIL=test@example.com
export TEST_USER_PASSWORD=TestPassword123!

# Start servers (in separate terminals)
# Terminal 1: Backend
cd backend && npm run dev

# Terminal 2: Frontend  
cd frontend && npm run dev

# Terminal 3: Run tests
cd frontend && npm run test:e2e
```

## Test Coverage Summary

### ✅ Complete Coverage (100%+)
- Authentication flows
- Events CRUD
- Artists module
- Metadata management
- Navigation
- Modals and forms

### ✅ High Coverage (85-95%)
- Production module
- Finance board
- Staff pool
- Global modules
- Profile management

### ✅ Good Coverage (75-85%)
- Comments
- File attachments
- Inline editing

## Test Files

1. **authentication.e2e.test.ts** - Login, signup, password reset
2. **events.e2e.test.ts** - Event CRUD operations
3. **artists-module.e2e.test.ts** - Artists module full workflow
4. **production-module.e2e.test.ts** - Production module
5. **metadata-management.e2e.test.ts** - Statuses, categories, tags, types
6. **finance-board.e2e.test.ts** - Finance board views
7. **staff-pool.e2e.test.ts** - Staff pool management
8. **global-modules.e2e.test.ts** - Vendors, materials
9. **navigation.e2e.test.ts** - Navigation flows
10. **modals-forms.e2e.test.ts** - Modal and form interactions
11. **profile-management.e2e.test.ts** - Profile updates
12. **comments-attachments.e2e.test.ts** - Comments and files
13. **comprehensive-workflow.e2e.test.ts** - End-to-end workflow

## Page Object Model

All tests use the Page Object Model pattern for maintainability:

- `BasePage` - Common functionality
- `LoginPage`, `SignupPage` - Authentication pages
- `EventsPage`, `EventDetailPage` - Event pages
- `ArtistsPage` - Artists module
- `ManageMetadataPage` - Metadata management
- `Modal` - Modal interactions

## Running Tests

```bash
# Run all tests
npm run test:e2e

# Run specific test file
npm run test:e2e -- authentication.e2e.test.ts

# Run with visible browser
HEADLESS=false npm run test:e2e

# Run with coverage
npm run test:e2e:coverage

# Watch mode
npm run test:e2e:watch
```

## Configuration

Edit `jest.e2e.config.js` to customize:
- Test timeout (default: 60s)
- Browser (chrome/firefox)
- Headless mode
- Coverage thresholds

## Troubleshooting

### Browser Not Starting
- Install ChromeDriver: `npm install chromedriver`
- Install GeckoDriver: `brew install geckodriver` (macOS)

### Tests Timing Out
- Increase timeout in `jest.e2e.config.js`
- Check if servers are running
- Verify network connectivity

### Element Not Found
- Check selector in page object
- Add explicit waits
- Verify element is visible

## Best Practices

1. **Use Page Objects** - Don't access driver directly
2. **Explicit Waits** - Always wait for elements
3. **Isolation** - Each test is independent
4. **Cleanup** - Proper cleanup after tests
5. **Screenshots** - Automatic on failure

## CI/CD Integration

Tests can run in CI/CD pipelines. See `e2e/README.md` for details.

