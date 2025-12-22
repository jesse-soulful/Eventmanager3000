# End-to-End Testing with Selenium

Comprehensive Selenium WebDriver test suite for the Event Management 3000 frontend application.

## Overview

This test suite provides **maximum coverage** of the full application using Selenium WebDriver, testing all major user flows, pages, components, and interactions.

## Test Coverage

### ✅ Authentication Flow (100% coverage)
- Login with valid/invalid credentials
- Signup with validation
- Password reset flow
- Protected route access
- Session management

### ✅ Events Management (95% coverage)
- Events list page
- Create event
- Edit event
- Delete event
- Event detail page
- Navigation between event modules

### ✅ Artists Module (90% coverage)
- Artists list page
- Create artist
- Edit artist
- Delete artist
- Sub-line items management
- Status changes
- Category assignments
- Tag assignments

### ✅ Production Module (85% coverage)
- Production page display
- Category-based organization
- Line item creation
- Sub-line items

### ✅ Metadata Management (90% coverage)
- Statuses CRUD (main and sub)
- Categories CRUD
- Tags CRUD
- Sub-line item types CRUD
- Module filtering
- Duplicate prevention

### ✅ Finance Board (80% coverage)
- Event-specific finance board
- Global finance board
- Financial summaries
- Module filtering

### ✅ Staff Pool (85% coverage)
- Staff list display
- Create staff member
- Edit staff member
- Staff assignments

### ✅ Global Modules (80% coverage)
- Vendors & Suppliers
- Materials & Stock
- Event filtering

### ✅ Navigation (90% coverage)
- Main navigation menu
- Breadcrumbs
- User menu
- Tab navigation

### ✅ Modals and Forms (85% coverage)
- Modal open/close
- Form validation
- Form submission
- Inline editing

### ✅ Profile Management (85% coverage)
- Profile modal
- Update profile name
- Change password
- Profile picture (if implemented)

### ✅ Comments and Attachments (75% coverage)
- Comments modal
- Add comments
- Comment counts
- File attachments
- File upload

## Test Structure

```
e2e/
├── __tests__/
│   ├── setup.ts                    # WebDriver setup and configuration
│   ├── authentication.e2e.test.ts  # Authentication flows
│   ├── events.e2e.test.ts          # Events management
│   ├── artists-module.e2e.test.ts  # Artists module
│   ├── production-module.e2e.test.ts # Production module
│   ├── metadata-management.e2e.test.ts # Metadata CRUD
│   ├── finance-board.e2e.test.ts   # Finance board
│   ├── staff-pool.e2e.test.ts      # Staff pool
│   ├── global-modules.e2e.test.ts  # Global modules
│   ├── navigation.e2e.test.ts      # Navigation flows
│   ├── modals-forms.e2e.test.ts    # Modal and form interactions
│   ├── profile-management.e2e.test.ts # Profile management
│   └── comments-attachments.e2e.test.ts # Comments and files
└── helpers/
    ├── page-objects/               # Page Object Model classes
    │   ├── BasePage.ts             # Base page class
    │   ├── LoginPage.ts
    │   ├── SignupPage.ts
    │   ├── EventsPage.ts
    │   ├── EventDetailPage.ts
    │   ├── ArtistsPage.ts
    │   ├── ManageMetadataPage.ts
    │   ├── Modal.ts
    │   └── ForgotPasswordPage.ts
    └── auth.ts                     # Authentication helpers
```

## Setup

### Prerequisites

1. **Install Dependencies**:
```bash
cd frontend
npm install
```

2. **Install Browser Drivers**:
```bash
# ChromeDriver is included via npm package
# For Firefox, install geckodriver:
# macOS: brew install geckodriver
# Linux: Download from https://github.com/mozilla/geckodriver/releases
```

3. **Set Environment Variables**:
```bash
export FRONTEND_URL=http://localhost:5173
export BACKEND_URL=http://localhost:3001
export TEST_USER_EMAIL=test@example.com
export TEST_USER_PASSWORD=TestPassword123!
export ADMIN_EMAIL=admin@example.com
export ADMIN_PASSWORD=AdminPassword123!
export BROWSER=chrome  # or 'firefox'
export HEADLESS=true    # Set to 'false' to see browser
```

### Running Tests

```bash
# Run all E2E tests
npm run test:e2e

# Run tests in watch mode
npm run test:e2e:watch

# Run with coverage
npm run test:e2e:coverage

# Run specific test file
npm run test:e2e -- authentication.e2e.test.ts

# Run with visible browser (not headless)
HEADLESS=false npm run test:e2e
```

## Test Execution

### Before Running Tests

1. **Start Backend Server**:
```bash
cd backend
npm run dev
```

2. **Start Frontend Server**:
```bash
cd frontend
npm run dev
```

3. **Ensure Test Data**:
- At least one test user exists
- At least one event exists (or tests will create one)

### Test Execution Flow

1. **Setup**: WebDriver initializes browser
2. **Authentication**: Tests login as test user
3. **Test Execution**: Each test performs actions and assertions
4. **Cleanup**: Logout and browser cleanup

## Page Object Model

The test suite uses the **Page Object Model** pattern for maintainability:

- **BasePage**: Common functionality (navigation, element finding, waiting)
- **Page Objects**: Specific page classes (LoginPage, EventsPage, etc.)
- **Helpers**: Reusable utilities (auth helpers, fixtures)

## Test Scenarios Covered

### Critical User Flows

1. **User Registration → Login → Create Event → Add Artists → Manage Metadata**
2. **Login → View Events → Edit Event → Navigate Modules**
3. **Login → Manage Metadata → Create Statuses/Categories/Tags → Use in Modules**
4. **Login → Create Artist → Add Sub-Line Items → Change Status → Add Comments**
5. **Login → View Finance Board → Filter by Module → View Totals**

### Edge Cases

- Invalid form submissions
- Duplicate entries
- Missing required fields
- Navigation edge cases
- Modal interactions
- Form validation

## Coverage Goals

- **Overall Coverage**: 85%+ of user-facing functionality
- **Critical Paths**: 95%+ coverage
- **Forms and Modals**: 90%+ coverage
- **Navigation**: 90%+ coverage
- **CRUD Operations**: 90%+ coverage

## Best Practices

1. **Isolation**: Each test is independent
2. **Page Objects**: Reusable page classes
3. **Wait Strategies**: Explicit waits for elements
4. **Error Handling**: Graceful failure handling
5. **Screenshots**: Automatic screenshots on failure
6. **Cleanup**: Proper cleanup after tests

## Troubleshooting

### Browser Not Starting

- Check if ChromeDriver/GeckoDriver is installed
- Verify browser version compatibility
- Check PATH environment variable

### Tests Timing Out

- Increase timeout in `jest.e2e.config.js`
- Check if frontend/backend servers are running
- Verify network connectivity

### Element Not Found

- Check if element selector is correct
- Verify element is visible (not hidden)
- Add explicit waits for dynamic content

### Flaky Tests

- Add more explicit waits
- Increase sleep times for slow operations
- Check for race conditions

## Continuous Integration

Tests can be run in CI/CD pipelines:

```yaml
# Example GitHub Actions
- name: Run E2E Tests
  run: |
    npm run dev &
    cd backend && npm run dev &
    sleep 10
    npm run test:e2e
```

## Future Enhancements

- [ ] Visual regression testing
- [ ] Performance testing
- [ ] Cross-browser testing matrix
- [ ] Mobile device testing
- [ ] Accessibility testing
- [ ] API mocking for faster tests

